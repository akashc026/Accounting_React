using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInventoryAdjustmentHandler : UpdateEntityHandler<AccountingDbContext, InventoryAdjustment, Guid, UpdateInventoryAdjustment, Guid>
    {
        public UpdateInventoryAdjustmentHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInventoryAdjustment, InventoryAdjustment> args)
        {
            return args.Entity.Id;
        }
    }
}

