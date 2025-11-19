using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreatePurchaseOrderHandler : CreateEntityHandler<AccountingDbContext, PurchaseOrder, Guid, CreatePurchaseOrder, Guid>
    {
        public CreatePurchaseOrderHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreatePurchaseOrder, PurchaseOrder> args)
        {
            return args.Entity.Id;
        }
    }
} 
