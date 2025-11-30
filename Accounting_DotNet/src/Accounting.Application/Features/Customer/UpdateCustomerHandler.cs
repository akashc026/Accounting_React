using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateCustomerHandler : UpdateEntityHandler<AccountingDbContext, Customer, Guid, UpdateCustomer, Guid>
    {
        public UpdateCustomerHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateCustomer, Customer> args)
        {
            return args.Entity.Id;
        }
    }
}
