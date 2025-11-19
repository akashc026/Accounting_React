using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreatePurchaseOrderLineHandler : CreateEntityHandler<AccountingDbContext, PurchaseOrderLine, Guid, CreatePurchaseOrderLine, Guid>
    {
        public CreatePurchaseOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreatePurchaseOrderLine, PurchaseOrderLine> args)
        {
            return args.Entity.Id;
        }
    }
} 
