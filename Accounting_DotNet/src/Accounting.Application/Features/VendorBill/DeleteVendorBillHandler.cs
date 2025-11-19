using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteVendorBillHandler : DeleteEntityHandler<AccountingDbContext, VendorBill, Guid, DeleteVendorBill>
    {
        public DeleteVendorBillHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
