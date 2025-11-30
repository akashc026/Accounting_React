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
    public class DeleteItemFulfilmentHandler : DeleteEntityHandler<AccountingDbContext, ItemFulfilment, Guid, DeleteItemFulfilment>
    {
        public DeleteItemFulfilmentHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteItemFulfilment request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"ItemFulfilment with Id of {request.Id} was not found.");
            }

            await EnsureNoBlockingReferencesAsync(request, cancellationToken);

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task EnsureNoBlockingReferencesAsync(DeleteItemFulfilment request, CancellationToken cancellationToken)
        {
            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "ItemFulfilmentLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("ItemFulfilment delete not allowed due to existing references.");
            }
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(ItemFulfilment))?.GetTableName() ?? nameof(ItemFulfilment);
        }

        private async Task SoftDeleteLinesAsync(Guid itemFulfilmentId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.ItemFulfilmentLines
                .IgnoreQueryFilters()
                .Where(x => x.DNID == itemFulfilmentId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.ItemFulfilmentLines.UpdateRange(lines);
            }
        }
    }
}
