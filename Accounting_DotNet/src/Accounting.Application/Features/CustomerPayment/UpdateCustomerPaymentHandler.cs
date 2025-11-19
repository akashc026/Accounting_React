using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCustomerPaymentHandler : UpdateEntityHandler<AccountingDbContext, CustomerPayment, Guid, UpdateCustomerPayment, Guid>
    {
        public UpdateCustomerPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateCustomerPayment, CustomerPayment> args)
        {
            return args.Entity.Id;
        }
    }
}
