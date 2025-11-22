using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateInventoryTransferLinesHandler : IRequestHandler<CreateInventoryTransferLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateInventoryTransferLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateInventoryTransferLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var inventoryTransferLine = new InventoryTransferLine
                {
                    Id = Guid.NewGuid(),
                    ItemID = lineDto.ItemID,
                    QuantityInHand = lineDto.QuantityInHand,
                    QuantityTransfer = lineDto.QuantityTransfer,
                    Rate = lineDto.Rate,
                    TotalAmount = lineDto.TotalAmount,
                    InventoryTransferID = lineDto.InventoryTransferID,
                    Reason = lineDto.Reason,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.InventoryTransferLines.Add(inventoryTransferLine);
                createdIds.Add(inventoryTransferLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
