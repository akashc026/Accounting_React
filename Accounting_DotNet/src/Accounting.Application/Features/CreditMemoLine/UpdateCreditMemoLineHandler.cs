using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCreditMemoLineHandler : UpdateEntityHandler<AccountingDbContext, CreditMemoLine, Guid, UpdateCreditMemoLine, Guid>
    {
        public UpdateCreditMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateCreditMemoLine, CreditMemoLine> args)
        {
            return args.Entity.Id;
        }
    }
}
