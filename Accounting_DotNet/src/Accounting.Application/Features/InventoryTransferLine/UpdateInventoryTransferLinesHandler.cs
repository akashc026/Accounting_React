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
    public class UpdateInventoryTransferLinesHandler : IRequestHandler<UpdateInventoryTransferLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateInventoryTransferLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateInventoryTransferLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.InventoryTransferLines
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
                    if (updateDto.ItemID.HasValue)
                        existingLine.ItemID = updateDto.ItemID.Value;

                    if (updateDto.QuantityInHand.HasValue)
                        existingLine.QuantityInHand = updateDto.QuantityInHand.Value;

                    if (updateDto.QuantityTransfer.HasValue)
                        existingLine.QuantityTransfer = updateDto.QuantityTransfer.Value;

                    if (updateDto.Rate.HasValue)
                        existingLine.Rate = updateDto.Rate;

                    if (updateDto.TotalAmount.HasValue)
                        existingLine.TotalAmount = updateDto.TotalAmount;

                    if (updateDto.InventoryTransferID.HasValue)
                        existingLine.InventoryTransferID = updateDto.InventoryTransferID.Value;

                    if (updateDto.Reason != null)
                        existingLine.Reason = updateDto.Reason;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
