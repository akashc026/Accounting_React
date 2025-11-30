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
    public class DeleteCreditMemoHandler : DeleteEntityHandler<AccountingDbContext, CreditMemo, Guid, DeleteCreditMemo>
    {
        public DeleteCreditMemoHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteCreditMemo request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"CreditMemo with Id of {request.Id} was not found.");
            }

            await EnsureNoBlockingReferencesAsync(request, cancellationToken);

            await SoftDeleteLinesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task EnsureNoBlockingReferencesAsync(DeleteCreditMemo request, CancellationToken cancellationToken)
        {
            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: GetTableName(),
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: "CreditMemoLines,CreditMemoPaymentLines",
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("CreditMemo delete not allowed due to existing references.");
            }
        }

        private string GetTableName()
        {
            return DbContext.Model.FindEntityType(typeof(CreditMemo))?.GetTableName() ?? nameof(CreditMemo);
        }

        private async Task SoftDeleteLinesAsync(Guid creditMemoId, CancellationToken cancellationToken)
        {
            var memoLines = await DbContext.CreditMemoLines
                .IgnoreQueryFilters()
                .Where(x => x.CMID == creditMemoId)
                .ToListAsync(cancellationToken);

            var paymentLines = await DbContext.CreditMemoPaymentLines
                .IgnoreQueryFilters()
                .Where(x => x.CMID == creditMemoId)
                .ToListAsync(cancellationToken);

            foreach (var line in memoLines)
            {
                line.IsDeleted = true;
            }

            foreach (var line in paymentLines)
            {
                line.IsDeleted = true;
            }

            if (memoLines.Count > 0)
            {
                DbContext.CreditMemoLines.UpdateRange(memoLines);
            }

            if (paymentLines.Count > 0)
            {
                DbContext.CreditMemoPaymentLines.UpdateRange(paymentLines);
            }
        }
    }
}
