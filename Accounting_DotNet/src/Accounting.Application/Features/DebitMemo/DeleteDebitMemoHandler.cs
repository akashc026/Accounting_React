using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteDebitMemoHandler : DeleteEntityHandler<AccountingDbContext, DebitMemo, Guid, DeleteDebitMemo>
    {
        public DeleteDebitMemoHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteDebitMemo request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"DebitMemo with Id of {request.Id} was not found.");
            }

            await EnsureNoBlockingReferencesAsync(request, cancellationToken);

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task EnsureNoBlockingReferencesAsync(DeleteDebitMemo request, CancellationToken cancellationToken)
        {
            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "DebitMemoLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("DebitMemo delete not allowed due to existing references.");
            }
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(DebitMemo))?.GetTableName() ?? nameof(DebitMemo);
        }

        private async Task SoftDeleteLinesAsync(Guid debitMemoId, CancellationToken cancellationToken)
        {
            var lines = await DbContext.DebitMemoLines
                .IgnoreQueryFilters()
                .Where(x => x.DebitMemoId == debitMemoId)
                .ToListAsync(cancellationToken);

            foreach (var line in lines)
            {
                line.IsDeleted = true;
            }

            if (lines.Count > 0)
            {
                DbContext.DebitMemoLines.UpdateRange(lines);
            }
        }
    }
}
