using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateChartOfAccountHandler : UpdateEntityHandler<AccountingDbContext, ChartOfAccount, Guid, UpdateChartOfAccount, Guid>
    {
        public UpdateChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<ChartOfAccount> UpdateEntityAsync(UpdateChartOfAccount request, ChartOfAccount entity, IMapper mapper, CancellationToken cancellationToken)
        {
            var previousRunningBalance = entity.RunningBalance ?? 0m;
            var updatedEntity = await base.UpdateEntityAsync(request, entity, mapper, cancellationToken);
            await ChartOfAccountRunningBalanceHelper.PropagateToParentsAsync(DbContext, updatedEntity, previousRunningBalance, cancellationToken);
            return updatedEntity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateChartOfAccount, ChartOfAccount> args)
        {
            return args.Entity.Id;
        }
    }
}
