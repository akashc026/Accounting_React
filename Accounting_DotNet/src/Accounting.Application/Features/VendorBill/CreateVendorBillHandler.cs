using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateVendorBillHandler : CreateEntityHandler<AccountingDbContext, VendorBill, Guid, CreateVendorBill, Guid>
    {
        public CreateVendorBillHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorBill, VendorBill> args)
        {
            return args.Entity.Id;
        }
    }
} 
