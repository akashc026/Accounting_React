using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateCustomerPaymentLineHandler : CreateEntityHandler<AccountingDbContext, CustomerPaymentLine, Guid, CreateCustomerPaymentLine, Guid>
    {
        public CreateCustomerPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateCustomerPaymentLine, CustomerPaymentLine> args)
        {
            return args.Entity.Id;
        }
    }
}
