using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInventoryAdjustmentHandler : CreateEntityHandler<AccountingDbContext, InventoryAdjustment, Guid, CreateInventoryAdjustment, Guid>
    {
        public CreateInventoryAdjustmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryAdjustment, InventoryAdjustment> args)
        {
            return args.Entity.Id;
        }
    }
}

