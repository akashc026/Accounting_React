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
    public class SyncItemFulfilmentInvoicedQuantitiesHandler : IRequestHandler<SyncItemFulfilmentInvoicedQuantities, Unit>
    {
        private readonly AccountingDbContext _dbContext;

        public SyncItemFulfilmentInvoicedQuantitiesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Unit> Handle(SyncItemFulfilmentInvoicedQuantities request, CancellationToken cancellationToken)
        {
            var ids = request.ItemFulfilmentLineIds?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList() ?? new List<Guid>();

            IQueryable<Accounting.Persistence.Models.InvoiceLine> invoiceLineQuery = _dbContext.InvoiceLines;

            if (request.InvoiceId.HasValue)
            {
                invoiceLineQuery = invoiceLineQuery.Where(line => line.INID == request.InvoiceId.Value);
            }

            var invoiceLineIds = await invoiceLineQuery
                .Where(line => line.ItemFulfillmentLineId.HasValue)
                .Select(line => line.ItemFulfillmentLineId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            ids.AddRange(invoiceLineIds);

            ids = ids
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            if (!ids.Any())
            {
                return Unit.Value;
            }

            var lineTotalsQuery = _dbContext.InvoiceLines
                .Where(line => line.ItemFulfillmentLineId.HasValue &&
                               ids.Contains(line.ItemFulfillmentLineId.Value));

            if (request.InvoiceId.HasValue)
            {
                lineTotalsQuery = lineTotalsQuery.Where(line => line.INID == request.InvoiceId.Value);
            }

            var invoicedTotals = await lineTotalsQuery
                .GroupBy(line => line.ItemFulfillmentLineId!.Value)
                .Select(group => new
                {
                    ItemFulfilmentLineId = group.Key,
                    Quantity = group.Where(x => !x.IsDeleted).Sum(x => x.QuantityDelivered)
                })
                .ToListAsync(cancellationToken);

            var fulfilmentLines = await _dbContext.ItemFulfilmentLines
                .Where(line => ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            var impactedFulfilmentIds = fulfilmentLines
                .Select(line => line.DNID)
                .Distinct()
                .ToList();

            foreach (var line in fulfilmentLines)
            {
                var total = invoicedTotals.FirstOrDefault(x => x.ItemFulfilmentLineId == line.Id);

                if (total == null || total.Quantity == 0)
                {
                    line.InvoicedQty = null;
                }
                else
                {
                    line.InvoicedQty = (int)Math.Round(total.Quantity, MidpointRounding.AwayFromZero);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (impactedFulfilmentIds.Any())
            {
                var statusLookup = await _dbContext.Statuses
                    .Where(status => !status.IsDeleted && status.Name != null)
                    .Select(status => new
                    {
                        status.Id,
                        NormalizedName = status.Name.Trim().ToLower()
                    })
                    .Where(status => status.NormalizedName == "closed" || status.NormalizedName == "open")
                    .ToListAsync(cancellationToken);

                var closedStatusId = statusLookup.FirstOrDefault(s => s.NormalizedName == "closed")?.Id ?? Guid.Empty;
                var openStatusId = statusLookup.FirstOrDefault(s => s.NormalizedName == "open")?.Id ?? Guid.Empty;

                var linesForFulfilments = await _dbContext.ItemFulfilmentLines
                    .Where(line => !line.IsDeleted && impactedFulfilmentIds.Contains(line.DNID))
                    .Select(line => new
                    {
                        line.DNID,
                        line.Quantity,
                        line.InvoicedQty
                    })
                    .ToListAsync(cancellationToken);

                if (linesForFulfilments.Any())
                {
                    var fulfilmentsFullyBilled = new List<Guid>();
                    var fulfilmentsNotFullyBilled = new List<Guid>();

                    foreach (var group in linesForFulfilments.GroupBy(line => line.DNID))
                    {
                        var allBilled = group.All(line => Convert.ToDecimal(line.InvoicedQty ?? 0) >= line.Quantity);
                        if (allBilled)
                        {
                            fulfilmentsFullyBilled.Add(group.Key);
                        }
                        else
                        {
                            fulfilmentsNotFullyBilled.Add(group.Key);
                        }
                    }

                    if (closedStatusId != Guid.Empty && fulfilmentsFullyBilled.Any())
                    {
                        var fulfilmentEntities = await _dbContext.ItemFulfilments
                            .Where(fulfilment => fulfilmentsFullyBilled.Contains(fulfilment.Id))
                            .ToListAsync(cancellationToken);

                        foreach (var fulfilment in fulfilmentEntities)
                        {
                            fulfilment.Status = closedStatusId;
                        }
                    }

                    if (openStatusId != Guid.Empty && fulfilmentsNotFullyBilled.Any())
                    {
                        var fulfilmentEntities = await _dbContext.ItemFulfilments
                            .Where(fulfilment => fulfilmentsNotFullyBilled.Contains(fulfilment.Id))
                            .ToListAsync(cancellationToken);

                        foreach (var fulfilment in fulfilmentEntities)
                        {
                            fulfilment.Status = openStatusId;
                        }
                    }

                    if ((closedStatusId != Guid.Empty && fulfilmentsFullyBilled.Any()) ||
                        (openStatusId != Guid.Empty && fulfilmentsNotFullyBilled.Any()))
                    {
                        await _dbContext.SaveChangesAsync(cancellationToken);
                    }
                }
            }

            return Unit.Value;
        }
    }
}
