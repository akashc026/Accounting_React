using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class CreateInventoryTransferHandler : CreateEntityHandler<AccountingDbContext, InventoryTransfer, Guid, CreateInventoryTransfer, Guid>
    {
        public CreateInventoryTransferHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryTransfer, InventoryTransfer> args)
        {
            return args.Entity.Id;
        }
    }
}

