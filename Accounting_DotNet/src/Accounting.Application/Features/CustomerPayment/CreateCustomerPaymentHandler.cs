using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateCustomerPaymentHandler : CreateEntityHandler<AccountingDbContext, CustomerPayment, Guid, CreateCustomerPayment, Guid>
    {
        public CreateCustomerPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateCustomerPayment, CustomerPayment> args)
        {
            return args.Entity.Id;
        }
    }
}
