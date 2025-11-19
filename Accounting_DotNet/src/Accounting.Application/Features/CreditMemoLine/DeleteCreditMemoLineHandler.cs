using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class DeleteCreditMemoLineHandler : DeleteEntityHandler<AccountingDbContext, CreditMemoLine, Guid, DeleteCreditMemoLine>
    {
        public DeleteCreditMemoLineHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }
    }
}
