using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteVendorBillLineHandler : DeleteEntityHandler<AccountingDbContext, VendorBillLine, Guid, DeleteVendorBillLine>
    {
        public DeleteVendorBillLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
