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
    public class UpdateItemReceiptLinesHandler : IRequestHandler<UpdateItemReceiptLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateItemReceiptLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateItemReceiptLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.ItemReceiptLines
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
                    if (updateDto.IRID.HasValue)
                        existingLine.IRID = updateDto.IRID.Value;

                    if (updateDto.ItemID.HasValue)
                        existingLine.ItemID = updateDto.ItemID.Value;

                    if (updateDto.Quantity.HasValue)
                        existingLine.Quantity = updateDto.Quantity.Value;

                    if (updateDto.Rate.HasValue)
                        existingLine.Rate = updateDto.Rate;

                    if (updateDto.TaxID.HasValue)
                        existingLine.TaxID = updateDto.TaxID;

                    if (updateDto.TaxPercent.HasValue)
                        existingLine.TaxPercent = updateDto.TaxPercent;

                    if (updateDto.TaxAmount.HasValue)
                        existingLine.TaxAmount = updateDto.TaxAmount;

                    if (updateDto.TotalAmount.HasValue)
                        existingLine.TotalAmount = updateDto.TotalAmount;

                    if (updateDto.PurchaseOrderLineId.HasValue)
                        existingLine.PurchaseOrderLineId = updateDto.PurchaseOrderLineId;

                    if (updateDto.InvoicedQty.HasValue)
                        existingLine.InvoicedQty = updateDto.InvoicedQty;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
