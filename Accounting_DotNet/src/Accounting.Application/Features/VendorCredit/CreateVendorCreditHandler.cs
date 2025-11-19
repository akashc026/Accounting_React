using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateVendorCreditHandler : CreateEntityHandler<AccountingDbContext, VendorCredit, Guid, CreateVendorCredit, Guid>
    {
        public CreateVendorCreditHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorCredit, VendorCredit> args)
        {
            return args.Entity.Id;
        }
    }
}
