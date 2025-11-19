using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CreateInventoryAdjustmentLineHandler : CreateEntityHandler<AccountingDbContext, InventoryAdjustmentLine, Guid, CreateInventoryAdjustmentLine, Guid>
    {
        public CreateInventoryAdjustmentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<InventoryAdjustmentLine> CreateEntityAsync(CreateInventoryAdjustmentLine request, IMapper mapper, CancellationToken cancellationToken)
        {
            var parentExists = await DbContext.InventoryAdjustments
                .AnyAsync(x => x.Id == request.InventoryAdjustmentID, cancellationToken);

            if (!parentExists)
            {
                throw new InvalidOperationException($"InventoryAdjustment with ID '{request.InventoryAdjustmentID}' does not exist.");
            }

            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryAdjustmentLine, InventoryAdjustmentLine> args)
        {
            return args.Entity.Id;
        }
    }
}

