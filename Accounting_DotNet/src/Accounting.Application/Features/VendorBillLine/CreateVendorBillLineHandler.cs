using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;


namespace Accounting.Application.Features
{
    public class CreateVendorBillLineHandler : CreateEntityHandler<AccountingDbContext, VendorBillLine, Guid, CreateVendorBillLine, Guid>
    {
        public CreateVendorBillLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }


        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateVendorBillLine, VendorBillLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
