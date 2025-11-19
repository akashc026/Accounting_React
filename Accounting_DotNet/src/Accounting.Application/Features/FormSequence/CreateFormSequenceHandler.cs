using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateFormSequenceHandler : CreateEntityHandler<AccountingDbContext, FormSequence, Guid, CreateFormSequence, Guid>
    {
        public CreateFormSequenceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateFormSequence, FormSequence> args)
        {
            return args.Entity.Id;
        }
    }
} 