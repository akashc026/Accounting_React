using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCreditMemoPaymentLineHandler : UpdateEntityHandler<AccountingDbContext, CreditMemoPaymentLine, Guid, UpdateCreditMemoPaymentLine, Guid>
    {
        public UpdateCreditMemoPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateCreditMemoPaymentLine, CreditMemoPaymentLine> args)
        {
            return args.Entity.Id;
        }
    }
}
