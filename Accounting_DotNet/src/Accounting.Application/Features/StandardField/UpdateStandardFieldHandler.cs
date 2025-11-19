using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateStandardFieldHandler : UpdateEntityHandler<AccountingDbContext, StandardField, Guid, UpdateStandardField, Guid>
    {
        public UpdateStandardFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateStandardField, StandardField> args)
        {
            return args.Entity.Id;
        }
    }
} 