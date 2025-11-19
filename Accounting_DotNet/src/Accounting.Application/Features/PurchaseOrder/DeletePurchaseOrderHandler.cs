using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeletePurchaseOrderHandler : DeleteEntityHandler<AccountingDbContext, PurchaseOrder, Guid, DeletePurchaseOrder>
    {
        public DeletePurchaseOrderHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
