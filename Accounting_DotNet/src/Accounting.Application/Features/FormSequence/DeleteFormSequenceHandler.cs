using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;

namespace Accounting.Application.Features
{
    public class DeleteFormSequenceHandler : DeleteEntityHandler<AccountingDbContext, FormSequence, Guid, DeleteFormSequence>
    {
        public DeleteFormSequenceHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
} 