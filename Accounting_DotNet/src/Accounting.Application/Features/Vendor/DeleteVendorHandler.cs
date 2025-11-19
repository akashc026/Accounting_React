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
    public class DeleteVendorHandler : DeleteEntityHandler<AccountingDbContext, Vendor, Guid, DeleteVendor>
    {
        public DeleteVendorHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
