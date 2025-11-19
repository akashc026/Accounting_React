using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteTypeOfFieldHandler : DeleteEntityHandler<AccountingDbContext, TypeOfField, Guid, DeleteTypeOfField>
    {
        public DeleteTypeOfFieldHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 