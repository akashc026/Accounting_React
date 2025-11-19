using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateVendorPaymentHandler : CreateEntityHandler<AccountingDbContext, VendorPayment, Guid, CreateVendorPayment, Guid>
    {
        public CreateVendorPaymentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorPayment, VendorPayment> args)
        {
            return args.Entity.Id;
        }
    }
}
