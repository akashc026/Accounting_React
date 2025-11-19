using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateJournalEntryHandler : CreateEntityHandler<AccountingDbContext, JournalEntry, Guid, CreateJournalEntry, Guid>
    {
        public CreateJournalEntryHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateJournalEntry, JournalEntry> args)
        {
            return args.Entity.Id;
        }
    }
}
