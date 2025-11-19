using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;


namespace Accounting.Application.Features
{
    public class CreateLocationHandler : CreateEntityHandler<AccountingDbContext, Location, Guid, CreateLocation, Guid>
    {
        public CreateLocationHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateLocation, Location> args)
        {
            return args.Entity.Id;
        }

    }
}
