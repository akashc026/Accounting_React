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
    public class UpdateVendorBillLinesHandler : IRequestHandler<UpdateVendorBillLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateVendorBillLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateVendorBillLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.VendorBillLines
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
                    if (updateDto.VBID.HasValue)
                        existingLine.VBID = updateDto.VBID.Value;

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

                    if (updateDto.IsActive.HasValue)
                        existingLine.IsActive = updateDto.IsActive;

                    if (updateDto.ItemReceiptLineId.HasValue)
                        existingLine.ItemReceiptLineId = updateDto.ItemReceiptLineId;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
