using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteInventoryTransferLineHandler : DeleteEntityHandler<AccountingDbContext, InventoryTransferLine, Guid, DeleteInventoryTransferLine>
    {
        public DeleteInventoryTransferLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}

