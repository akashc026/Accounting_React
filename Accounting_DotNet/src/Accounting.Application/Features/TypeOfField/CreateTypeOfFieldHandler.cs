using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateTypeOfFieldHandler : CreateEntityHandler<AccountingDbContext, TypeOfField, Guid, CreateTypeOfField, Guid>
    {
        public CreateTypeOfFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateTypeOfField, TypeOfField> args)
        {
            return args.Entity.Id;
        }
    }
} 