using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteChartOfAccountHandler : DeleteEntityHandler<AccountingDbContext, ChartOfAccount, Guid, DeleteChartOfAccount>
    {
        public DeleteChartOfAccountHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteChartOfAccount request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new KeyNotFoundException($"ChartOfAccount with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: "ChartOfAccount",
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: null,
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("Chart of account delete not allowed due to existing references.");
            }

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }
    }
}
