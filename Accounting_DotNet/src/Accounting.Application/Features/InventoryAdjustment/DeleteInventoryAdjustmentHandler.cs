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
    public class DeleteInventoryAdjustmentHandler : DeleteEntityHandler<AccountingDbContext, InventoryAdjustment, Guid, DeleteInventoryAdjustment>
    {
        public DeleteInventoryAdjustmentHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteInventoryAdjustment request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new KeyNotFoundException($"InventoryAdjustment with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "InventoryAdjustmentLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("InventoryAdjustment delete not allowed due to existing references.");
            }

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(InventoryAdjustment))?.GetTableName() ?? nameof(InventoryAdjustment);
        }

        private async Task SoftDeleteLinesAsync(Guid inventoryAdjustmentId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.InventoryAdjustmentLines
                .IgnoreQueryFilters()
                .Where(x => x.InventoryAdjustmentID == inventoryAdjustmentId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.InventoryAdjustmentLines.UpdateRange(lines);
            }
        }
    }
}
