using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateInventoryTransferHandler : UpdateEntityHandler<AccountingDbContext, InventoryTransfer, Guid, UpdateInventoryTransfer, Guid>
    {
        public UpdateInventoryTransferHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<UpdateInventoryTransfer, InventoryTransfer> args)
        {
            return args.Entity.Id;
        }
    }
}

