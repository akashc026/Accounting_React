using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateVendorCreditLineHandler : CreateEntityHandler<AccountingDbContext, VendorCreditLine, Guid, CreateVendorCreditLine, Guid>
    {
        public CreateVendorCreditLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorCreditLine, VendorCreditLine> args)
        {
            return args.Entity.Id;
        }
    }
}
