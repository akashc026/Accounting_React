using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteInventoryDetailHandler : DeleteEntityHandler<AccountingDbContext, InventoryDetail, Guid, DeleteInventoryDetail>
    {
        public DeleteInventoryDetailHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
