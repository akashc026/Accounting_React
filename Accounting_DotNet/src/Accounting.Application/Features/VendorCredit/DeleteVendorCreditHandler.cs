using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteVendorCreditHandler : DeleteEntityHandler<AccountingDbContext, VendorCredit, Guid, DeleteVendorCredit>
    {
        public DeleteVendorCreditHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteVendorCredit request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new KeyNotFoundException($"VendorCredit with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "VendorCreditLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("VendorCredit delete not allowed due to existing references.");
            }

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(VendorCredit))?.GetTableName() ?? nameof(VendorCredit);
        }

        private async Task SoftDeleteLinesAsync(Guid vendorCreditId, CancellationToken cancellationToken)
        {
            var creditLines = await DbContext.VendorCreditLines
                .IgnoreQueryFilters()
                .Where(x => x.VCID == vendorCreditId)
                .ToListAsync(cancellationToken);

            var paymentLines = await DbContext.VendorCreditPaymentLines
                .IgnoreQueryFilters()
                .Where(x => x.VCID == vendorCreditId)
                .ToListAsync(cancellationToken);

            foreach (var line in creditLines)
            {
                line.IsDeleted = true;
            }

            foreach (var line in paymentLines)
            {
                line.IsDeleted = true;
            }

            if (creditLines.Count > 0)
            {
                DbContext.VendorCreditLines.UpdateRange(creditLines);
            }

            if (paymentLines.Count > 0)
            {
                DbContext.VendorCreditPaymentLines.UpdateRange(paymentLines);
            }
        }
    }
}
