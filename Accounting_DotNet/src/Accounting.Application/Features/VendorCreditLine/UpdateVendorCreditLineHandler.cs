using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditLineHandler : UpdateEntityHandler<AccountingDbContext, VendorCreditLine, Guid, UpdateVendorCreditLine, Guid>
    {
        public UpdateVendorCreditLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateVendorCreditLine, VendorCreditLine> args)
        {
            return args.Entity.Id;
        }
    }
}
