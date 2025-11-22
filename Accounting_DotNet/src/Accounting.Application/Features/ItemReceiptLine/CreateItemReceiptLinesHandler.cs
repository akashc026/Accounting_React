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
    public class CreateItemReceiptLinesHandler : IRequestHandler<CreateItemReceiptLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateItemReceiptLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateItemReceiptLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var itemReceiptLine = new ItemReceiptLine
                {
                    Id = Guid.NewGuid(),
                    IRID = lineDto.IRID,
                    ItemID = lineDto.ItemID,
                    Quantity = lineDto.Quantity,
                    Rate = lineDto.Rate,
                    TaxID = lineDto.TaxID,
                    TaxPercent = lineDto.TaxPercent,
                    TaxAmount = lineDto.TaxAmount,
                    TotalAmount = lineDto.TotalAmount,
                    PurchaseOrderLineId = lineDto.PurchaseOrderLineId,
                    InvoicedQty = lineDto.InvoicedQty,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.ItemReceiptLines.Add(itemReceiptLine);
                createdIds.Add(itemReceiptLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
