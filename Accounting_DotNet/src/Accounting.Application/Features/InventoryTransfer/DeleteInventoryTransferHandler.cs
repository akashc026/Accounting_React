using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteInventoryTransferHandler : DeleteEntityHandler<AccountingDbContext, InventoryTransfer, Guid, DeleteInventoryTransfer>
    {
        public DeleteInventoryTransferHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}

