using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteInventoryAdjustmentLineHandler : DeleteEntityHandler<AccountingDbContext, InventoryAdjustmentLine, Guid, DeleteInventoryAdjustmentLine>
    {
        public DeleteInventoryAdjustmentLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}

