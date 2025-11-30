using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateFormSequenceHandler : DeleteRestrictedUpdateEntityHandler<FormSequence, UpdateFormSequence>
    {
        public UpdateFormSequenceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateFormSequence, FormSequence> args)
        {
            return args.Entity.Id;
        }
    }
} 