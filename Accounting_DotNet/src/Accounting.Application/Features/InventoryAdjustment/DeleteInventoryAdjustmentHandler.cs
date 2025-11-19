using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteInventoryAdjustmentHandler : DeleteEntityHandler<AccountingDbContext, InventoryAdjustment, Guid, DeleteInventoryAdjustment>
    {
        public DeleteInventoryAdjustmentHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}

