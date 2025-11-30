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
    public class DeleteVendorBillHandler : DeleteEntityHandler<AccountingDbContext, VendorBill, Guid, DeleteVendorBill>
    {
        public DeleteVendorBillHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteVendorBill request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new KeyNotFoundException($"VendorBill with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "VendorBillLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("VendorBill delete not allowed due to existing references.");
            }

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(VendorBill))?.GetTableName() ?? nameof(VendorBill);
        }

        private async Task SoftDeleteLinesAsync(Guid vendorBillId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.VendorBillLines
                .IgnoreQueryFilters()
                .Where(x => x.VBID == vendorBillId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.VendorBillLines.UpdateRange(lines);
            }
        }
    }
}
