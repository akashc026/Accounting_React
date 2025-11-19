using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateTypeOfFieldHandler : UpdateEntityHandler<AccountingDbContext, TypeOfField, Guid, UpdateTypeOfField, Guid>
    {
        public UpdateTypeOfFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateTypeOfField, TypeOfField> args)
        {
            return args.Entity.Id;
        }
    }
} 