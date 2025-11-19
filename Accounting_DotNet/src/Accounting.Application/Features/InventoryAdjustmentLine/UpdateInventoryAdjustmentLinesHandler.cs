using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateInventoryAdjustmentLinesHandler : IRequestHandler<UpdateInventoryAdjustmentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateInventoryAdjustmentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateInventoryAdjustmentLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.InventoryAdjustmentLines
                .Where(line => ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            if (!existingLines.Any())
            {
                return 0;
            }

            foreach (var existingLine in existingLines)
            {
                var updateDto = request.Lines.FirstOrDefault(l => l.Id == existingLine.Id);
                if (updateDto != null)
                {
                    // Only update fields that are provided (not null)
                    if (updateDto.InventoryAdjustmentID.HasValue)
                        existingLine.InventoryAdjustmentID = updateDto.InventoryAdjustmentID.Value;

                    if (updateDto.ItemID.HasValue)
                        existingLine.ItemID = updateDto.ItemID.Value;

                    if (updateDto.QuantityInHand.HasValue)
                        existingLine.QuantityInHand = updateDto.QuantityInHand.Value;

                    if (updateDto.QuantityAdjusted.HasValue)
                        existingLine.QuantityAdjusted = updateDto.QuantityAdjusted.Value;

                    if (updateDto.Rate.HasValue)
                        existingLine.Rate = updateDto.Rate;

                    if (updateDto.TotalAmount.HasValue)
                        existingLine.TotalAmount = updateDto.TotalAmount;

                    if (updateDto.Reason != null)
                        existingLine.Reason = updateDto.Reason;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
