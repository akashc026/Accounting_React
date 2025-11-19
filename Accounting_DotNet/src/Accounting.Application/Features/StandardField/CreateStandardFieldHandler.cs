using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateStandardFieldHandler : CreateEntityHandler<AccountingDbContext, StandardField, Guid, CreateStandardField, Guid>
    {
        public CreateStandardFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateStandardField, StandardField> args)
        {
            return args.Entity.Id;
        }
    }
} 