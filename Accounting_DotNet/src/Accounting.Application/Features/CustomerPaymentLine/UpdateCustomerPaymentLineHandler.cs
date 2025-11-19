using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCustomerPaymentLineHandler : UpdateEntityHandler<AccountingDbContext, CustomerPaymentLine, Guid, UpdateCustomerPaymentLine, Guid>
    {
        public UpdateCustomerPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateCustomerPaymentLine, CustomerPaymentLine> args)
        {
            return args.Entity.Id;
        }
    }
}
