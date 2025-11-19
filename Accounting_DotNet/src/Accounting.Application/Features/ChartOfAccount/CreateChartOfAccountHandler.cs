using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateChartOfAccountHandler : CreateEntityHandler<AccountingDbContext, ChartOfAccount, Guid, CreateChartOfAccount, Guid>
    {
        public CreateChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateChartOfAccount, ChartOfAccount> args)
        {
            return args.Entity.Id;
        }
    }
}
