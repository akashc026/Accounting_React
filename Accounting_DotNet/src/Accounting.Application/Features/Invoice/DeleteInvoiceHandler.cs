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
    public class DeleteInvoiceHandler : DeleteEntityHandler<AccountingDbContext, Invoice, Guid, DeleteInvoice>
    {
        public DeleteInvoiceHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteInvoice request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"Invoice with Id of {request.Id} was not found.");
            }

            await EnsureNoBlockingReferencesAsync(request, cancellationToken);

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task EnsureNoBlockingReferencesAsync(DeleteInvoice request, CancellationToken cancellationToken)
        {
            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "InvoiceLines,CustomerPaymentLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("Invoice delete not allowed due to existing references.");
            }
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(Invoice))?.GetTableName() ?? nameof(Invoice);
        }

        private async Task SoftDeleteLinesAsync(Guid invoiceId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.InvoiceLines
                .IgnoreQueryFilters()
                .Where(x => x.INID == invoiceId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.InvoiceLines.UpdateRange(lines);
            }
        }
    }
}
