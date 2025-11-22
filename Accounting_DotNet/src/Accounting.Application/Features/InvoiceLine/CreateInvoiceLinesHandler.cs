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
    public class CreateInvoiceLinesHandler : IRequestHandler<CreateInvoiceLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateInvoiceLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateInvoiceLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var invoiceLine = new InvoiceLine
                {
                    Id = Guid.NewGuid(),
                    INID = lineDto.INID,
                    ItemID = lineDto.ItemID,
                    QuantityDelivered = lineDto.QuantityDelivered,
                    Rate = lineDto.Rate,
                    TaxID = lineDto.TaxID,
                    TaxPercent = lineDto.TaxPercent,
                    TaxRate = lineDto.TaxRate,
                    TotalAmount = lineDto.TotalAmount,
                    ItemFulfillmentLineId = lineDto.ItemFulfillmentLineId,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.InvoiceLines.Add(invoiceLine);
                createdIds.Add(invoiceLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
