using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateCreditMemoPaymentLineHandler : CreateEntityHandler<AccountingDbContext, CreditMemoPaymentLine, Guid, CreateCreditMemoPaymentLine, Guid>
    {
        public CreateCreditMemoPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateCreditMemoPaymentLine, CreditMemoPaymentLine> args)
        {
            return args.Entity.Id;
        }
    }
}
