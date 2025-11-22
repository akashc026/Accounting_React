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
    public class CreateInventoryAdjustmentLinesHandler : IRequestHandler<CreateInventoryAdjustmentLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateInventoryAdjustmentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateInventoryAdjustmentLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var inventoryAdjustmentLine = new InventoryAdjustmentLine
                {
                    Id = Guid.NewGuid(),
                    InventoryAdjustmentID = lineDto.InventoryAdjustmentID,
                    ItemID = lineDto.ItemID,
                    QuantityInHand = lineDto.QuantityInHand,
                    QuantityAdjusted = lineDto.QuantityAdjusted,
                    Rate = lineDto.Rate,
                    TotalAmount = lineDto.TotalAmount,
                    Reason = lineDto.Reason,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.InventoryAdjustmentLines.Add(inventoryAdjustmentLine);
                createdIds.Add(inventoryAdjustmentLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
