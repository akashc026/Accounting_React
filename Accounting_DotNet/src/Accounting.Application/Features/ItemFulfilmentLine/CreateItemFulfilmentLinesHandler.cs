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
    public class CreateItemFulfilmentLinesHandler : IRequestHandler<CreateItemFulfilmentLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateItemFulfilmentLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateItemFulfilmentLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var itemFulfilmentLine = new ItemFulfilmentLine
                {
                    Id = Guid.NewGuid(),
                    DNID = lineDto.DNID,
                    ItemID = lineDto.ItemID,
                    TaxID = lineDto.TaxID,
                    Quantity = lineDto.Quantity,
                    Rate = lineDto.Rate,
                    TaxPercent = lineDto.TaxPercent,
                    TaxAmount = lineDto.TaxAmount,
                    TotalAmount = lineDto.TotalAmount,
                    InvoicedQty = lineDto.InvoicedQty,
                    SalesOrderLineId = lineDto.SalesOrderLineId
                };

                _dbContext.ItemFulfilmentLines.Add(itemFulfilmentLine);
                createdIds.Add(itemFulfilmentLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
