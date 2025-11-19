using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class DeleteDebitMemoHandler : DeleteEntityHandler<AccountingDbContext, DebitMemo, Guid, DeleteDebitMemo>
    {
        public DeleteDebitMemoHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
