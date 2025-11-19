using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;

namespace Accounting.Application.Features
{
    public class DeleteRecordTypeHandler : DeleteEntityHandler<AccountingDbContext, RecordType, Guid, DeleteRecordType>
    {
        public DeleteRecordTypeHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 