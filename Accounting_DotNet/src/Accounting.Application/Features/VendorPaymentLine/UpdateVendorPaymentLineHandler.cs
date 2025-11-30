using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateVendorPaymentLineHandler : DeleteRestrictedUpdateEntityHandler<VendorPaymentLine, UpdateVendorPaymentLine>
    {
        public UpdateVendorPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateVendorPaymentLine, VendorPaymentLine> args)
        {
            return args.Entity.Id;
        }

         protected override string? GetExcludedTables()
        {
            return "VendorPayment";
        }
    }
}
