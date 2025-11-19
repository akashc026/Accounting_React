using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteChartOfAccountHandler : DeleteEntityHandler<AccountingDbContext, ChartOfAccount, Guid, DeleteChartOfAccount>
    {
        public DeleteChartOfAccountHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
