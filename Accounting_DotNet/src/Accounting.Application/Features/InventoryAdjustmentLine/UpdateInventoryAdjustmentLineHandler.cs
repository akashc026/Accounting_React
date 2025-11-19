using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInventoryAdjustmentLineHandler : UpdateEntityHandler<AccountingDbContext, InventoryAdjustmentLine, Guid, UpdateInventoryAdjustmentLine, Guid>
    {
        public UpdateInventoryAdjustmentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInventoryAdjustmentLine, InventoryAdjustmentLine> args)
        {
            return args.Entity.Id;
        }
    }
}

