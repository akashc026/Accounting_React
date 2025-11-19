using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteChartOfAccountHandler : DeleteEntityHandler<AccountingDbContext, ChartOfAccount, Guid, DeleteChartOfAccount>
    {
        public DeleteChartOfAccountHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
