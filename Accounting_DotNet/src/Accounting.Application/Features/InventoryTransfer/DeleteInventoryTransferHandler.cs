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
    public class DeleteInventoryTransferHandler : DeleteEntityHandler<AccountingDbContext, InventoryTransfer, Guid, DeleteInventoryTransfer>
    {
        public DeleteInventoryTransferHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteInventoryTransfer request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new KeyNotFoundException($"InventoryTransfer with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "InventoryTransferLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("InventoryTransfer delete not allowed due to existing references.");
            }

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(InventoryTransfer))?.GetTableName() ?? nameof(InventoryTransfer);
        }

        private async Task SoftDeleteLinesAsync(Guid inventoryTransferId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.InventoryTransferLines
                .IgnoreQueryFilters()
                .Where(x => x.InventoryTransferID == inventoryTransferId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.InventoryTransferLines.UpdateRange(lines);
            }
        }
    }
}
