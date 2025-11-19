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
    public class UpdateItemFulfilmentLinesHandler : IRequestHandler<UpdateItemFulfilmentLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateItemFulfilmentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateItemFulfilmentLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.ItemFulfilmentLines
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
                    if (updateDto.DNID.HasValue)
                        existingLine.DNID = updateDto.DNID.Value;

                    if (updateDto.ItemID.HasValue)
                        existingLine.ItemID = updateDto.ItemID.Value;

                    if (updateDto.TaxID.HasValue)
                        existingLine.TaxID = updateDto.TaxID;

                    if (updateDto.Quantity.HasValue)
                        existingLine.Quantity = updateDto.Quantity.Value;

                    if (updateDto.Rate.HasValue)
                        existingLine.Rate = updateDto.Rate.Value;

                    if (updateDto.TaxPercent.HasValue)
                        existingLine.TaxPercent = updateDto.TaxPercent.Value;

                    if (updateDto.TaxAmount.HasValue)
                        existingLine.TaxAmount = updateDto.TaxAmount.Value;

                    if (updateDto.TotalAmount.HasValue)
                        existingLine.TotalAmount = updateDto.TotalAmount.Value;

                    if (updateDto.InvoicedQty.HasValue)
                        existingLine.InvoicedQty = updateDto.InvoicedQty;

                    if (updateDto.SalesOrderLineId.HasValue)
                        existingLine.SalesOrderLineId = updateDto.SalesOrderLineId;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
