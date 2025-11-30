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
    public class DeleteCustomerPaymentHandler : DeleteEntityHandler<AccountingDbContext, CustomerPayment, Guid, DeleteCustomerPayment>
    {
        public DeleteCustomerPaymentHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteCustomerPayment request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"CustomerPayment with Id of {request.Id} was not found.");
            }

            await EnsureNoBlockingReferencesAsync(request, cancellationToken);

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task EnsureNoBlockingReferencesAsync(DeleteCustomerPayment request, CancellationToken cancellationToken)
        {
            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "CustomerPaymentLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("CustomerPayment delete not allowed due to existing references.");
            }
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(CustomerPayment))?.GetTableName() ?? nameof(CustomerPayment);
        }

        private async Task SoftDeleteLinesAsync(Guid customerPaymentId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.CustomerPaymentLines
                .IgnoreQueryFilters()
                .Where(x => x.PaymentId == customerPaymentId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.CustomerPaymentLines.UpdateRange(lines);
            }
        }
    }
}
