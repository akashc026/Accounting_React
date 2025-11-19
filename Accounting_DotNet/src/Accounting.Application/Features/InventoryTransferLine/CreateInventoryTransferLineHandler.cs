using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CreateInventoryTransferLineHandler : CreateEntityHandler<AccountingDbContext, InventoryTransferLine, Guid, CreateInventoryTransferLine, Guid>
    {
        public CreateInventoryTransferLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<InventoryTransferLine> CreateEntityAsync(CreateInventoryTransferLine request, IMapper mapper, CancellationToken cancellationToken)
        {
            var parentExists = await DbContext.InventoryTransfers
                .AnyAsync(x => x.Id == request.InventoryTransferID, cancellationToken);

            if (!parentExists)
            {
                throw new InvalidOperationException($"InventoryTransfer with ID '{request.InventoryTransferID}' does not exist.");
            }

            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryTransferLine, InventoryTransferLine> args)
        {
            return args.Entity.Id;
        }
    }
}

