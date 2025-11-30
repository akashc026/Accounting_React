using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateAccountTypeHandler : DeleteRestrictedUpdateEntityHandler<AccountType, UpdateAccountType>
    {
        public UpdateAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }
    }
} 
