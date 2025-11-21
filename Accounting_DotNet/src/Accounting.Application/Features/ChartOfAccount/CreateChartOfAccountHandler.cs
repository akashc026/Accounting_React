using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateChartOfAccountHandler : CreateEntityHandler<AccountingDbContext, ChartOfAccount, Guid, CreateChartOfAccount, Guid>
    {
        public CreateChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<ChartOfAccount> CreateEntityAsync(CreateChartOfAccount request, IMapper mapper, CancellationToken cancellationToken)
        {
            var entity = await base.CreateEntityAsync(request, mapper, cancellationToken);
            if (entity.IsParent != true && entity.Parent.HasValue && entity.RunningBalance.HasValue)
            {
                await ChartOfAccountRunningBalanceHelper.PropagateToParentsAsync(DbContext, entity, 0m, cancellationToken);
            }
            return entity;
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateChartOfAccount, ChartOfAccount> args)
        {
            return args.Entity.Id;
        }
    }
}
