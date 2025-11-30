using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateLocationHandler : UpdateEntityHandler<AccountingDbContext, Location, Guid, UpdateLocation, Guid>
    {
        public UpdateLocationHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateLocation, Location> args)
        {
            return args.Entity.Id;
        }
    }
}
