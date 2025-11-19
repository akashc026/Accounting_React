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
    public class DeleteSalesOrderHandler : DeleteEntityHandler<AccountingDbContext, SalesOrder, Guid, DeleteSalesOrder>
    {
        public DeleteSalesOrderHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 