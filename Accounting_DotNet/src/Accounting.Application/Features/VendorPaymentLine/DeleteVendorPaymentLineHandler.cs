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
    public class DeleteVendorPaymentLineHandler : DeleteEntityHandler<AccountingDbContext, VendorPaymentLine, Guid, DeleteVendorPaymentLine>
    {
        public DeleteVendorPaymentLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
