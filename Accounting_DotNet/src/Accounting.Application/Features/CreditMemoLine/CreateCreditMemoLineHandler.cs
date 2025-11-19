using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateCreditMemoLineHandler : CreateEntityHandler<AccountingDbContext, CreditMemoLine, Guid, CreateCreditMemoLine, Guid>
    {
        public CreateCreditMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateCreditMemoLine, CreditMemoLine> args)
        {
            return args.Entity.Id;
        }
    }
}
