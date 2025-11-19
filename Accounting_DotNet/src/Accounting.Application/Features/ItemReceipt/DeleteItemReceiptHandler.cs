using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteItemReceiptHandler : DeleteEntityHandler<AccountingDbContext, ItemReceipt, Guid, DeleteItemReceipt>
    {
        public DeleteItemReceiptHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
