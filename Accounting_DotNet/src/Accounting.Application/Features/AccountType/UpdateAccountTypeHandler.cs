using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateAccountTypeHandler : UpdateEntityHandler<AccountingDbContext, AccountType, Guid, UpdateAccountType, Guid>
    {
        public UpdateAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }
    }
} 
