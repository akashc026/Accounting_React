using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateAccountTypeHandler : CreateEntityHandler<AccountingDbContext, AccountType, Guid, CreateAccountType, Guid>
    {
        public CreateAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateAccountType, AccountType> args)
        {
            return args.Entity.Id;
        }
    }
} 
