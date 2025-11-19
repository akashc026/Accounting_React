using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteStandardFieldHandler : DeleteEntityHandler<AccountingDbContext, StandardField, Guid, DeleteStandardField>
    {
        public DeleteStandardFieldHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 