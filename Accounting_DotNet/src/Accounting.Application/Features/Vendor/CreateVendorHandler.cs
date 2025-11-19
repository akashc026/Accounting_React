using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;


namespace Accounting.Application.Features
{
    public class CreateVendorHandler : CreateEntityHandler<AccountingDbContext, Vendor, Guid, CreateVendor, Guid>
    {
        public CreateVendorHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendor, Vendor> args)
        {
            return args.Entity.Id;
        }

    }
}
