using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteSalesOrderLineHandler : DeleteEntityHandler<AccountingDbContext, SalesOrderLine, Guid, DeleteSalesOrderLine>
    {
        public DeleteSalesOrderLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 