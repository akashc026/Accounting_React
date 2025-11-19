using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateJournalEntryLineHandler : CreateEntityHandler<AccountingDbContext, JournalEntryLine, Guid, CreateJournalEntryLine, Guid>
    {
        public CreateJournalEntryLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateJournalEntryLine, JournalEntryLine> args)
        {
            return args.Entity.Id;
        }
    }
}
