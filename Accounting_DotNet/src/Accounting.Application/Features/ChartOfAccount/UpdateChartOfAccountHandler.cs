using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateChartOfAccountHandler : UpdateEntityHandler<AccountingDbContext, ChartOfAccount, Guid, UpdateChartOfAccount, Guid>
    {
        public UpdateChartOfAccountHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateChartOfAccount, ChartOfAccount> args)
        {
            return args.Entity.Id;
        }
    }
}
