using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateTaxHandler : CreateEntityHandler<AccountingDbContext, Tax, Guid, CreateTax, Guid>
    {
        public CreateTaxHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateTax, Tax> args)
        {
            return args.Entity.Id;
        }
    }
} 