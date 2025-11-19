using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteItemReceiptLineHandler : DeleteEntityHandler<AccountingDbContext, ItemReceiptLine, Guid, DeleteItemReceiptLine>
    {
        public DeleteItemReceiptLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
