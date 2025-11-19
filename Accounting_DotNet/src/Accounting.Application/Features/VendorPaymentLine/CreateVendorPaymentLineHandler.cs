using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateVendorPaymentLineHandler : CreateEntityHandler<AccountingDbContext, VendorPaymentLine, Guid, CreateVendorPaymentLine, Guid>
    {
        public CreateVendorPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorPaymentLine, VendorPaymentLine> args)
        {
            return args.Entity.Id;
        }
    }
}
