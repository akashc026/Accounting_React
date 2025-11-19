using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteJournalEntryLineHandler : DeleteEntityHandler<AccountingDbContext, JournalEntryLine, Guid, DeleteJournalEntryLine>
    {
        public DeleteJournalEntryLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
