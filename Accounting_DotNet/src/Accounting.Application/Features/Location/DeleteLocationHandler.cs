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
    public class DeleteLocationHandler : DeleteEntityHandler<AccountingDbContext, Location, Guid, DeleteLocation>
    {
        public DeleteLocationHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
