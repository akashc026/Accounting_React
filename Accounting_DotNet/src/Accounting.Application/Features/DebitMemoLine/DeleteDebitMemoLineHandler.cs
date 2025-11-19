using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class DeleteDebitMemoLineHandler : DeleteEntityHandler<AccountingDbContext, DebitMemoLine, Guid, DeleteDebitMemoLine>
    {
        public DeleteDebitMemoLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
