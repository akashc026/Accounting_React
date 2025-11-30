using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInventoryTransferLineHandler : DeleteRestrictedUpdateEntityHandler<InventoryTransferLine, UpdateInventoryTransferLine>
    {
        public UpdateInventoryTransferLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInventoryTransferLine, InventoryTransferLine> args)
        {
            return args.Entity.Id;
        }
         protected override string? GetExcludedTables()
        {
            return "InventoryTransfer";
        }
    }
}

