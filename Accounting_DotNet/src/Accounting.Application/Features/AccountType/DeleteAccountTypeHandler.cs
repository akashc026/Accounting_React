using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class DeleteAccountTypeHandler : DeleteEntityHandler<AccountingDbContext, AccountType, Guid, DeleteAccountType>
    {
        public DeleteAccountTypeHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 
