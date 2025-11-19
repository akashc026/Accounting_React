using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeletePurchaseOrderLineHandler : DeleteEntityHandler<AccountingDbContext, PurchaseOrderLine, Guid, DeletePurchaseOrderLine>
    {
        public DeletePurchaseOrderLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
