using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteJournalEntryHandler : DeleteEntityHandler<AccountingDbContext, JournalEntry, Guid, DeleteJournalEntry>
    {
        public DeleteJournalEntryHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
