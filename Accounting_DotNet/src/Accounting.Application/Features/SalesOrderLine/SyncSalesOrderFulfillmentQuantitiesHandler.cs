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
    public class SyncSalesOrderFulfillmentQuantitiesHandler : IRequestHandler<SyncSalesOrderFulfillmentQuantities, Unit>
    {
        private readonly AccountingDbContext _dbContext;

        public SyncSalesOrderFulfillmentQuantitiesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Unit> Handle(SyncSalesOrderFulfillmentQuantities request, CancellationToken cancellationToken)
        {
            var ids = request.SalesOrderLineIds?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList() ?? new List<Guid>();

            if (request.ItemFulfilmentId.HasValue)
            {
                var fulfilmentLineIds = await _dbContext.ItemFulfilmentLines
                    .Where(line => line.DNID == request.ItemFulfilmentId.Value && line.SalesOrderLineId.HasValue)
                    .Select(line => line.SalesOrderLineId!.Value)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                ids.AddRange(fulfilmentLineIds);
            }

            ids = ids
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            if (!ids.Any())
            {
                return Unit.Value;
            }

            var fulfilmentTotals = await _dbContext.ItemFulfilmentLines
                .Where(line => !line.IsDeleted &&
                               line.SalesOrderLineId.HasValue &&
                               ids.Contains(line.SalesOrderLineId.Value))
                .GroupBy(line => line.SalesOrderLineId!.Value)
                .Select(group => new
                {
                    SalesOrderLineId = group.Key,
                    Quantity = group.Sum(x => x.Quantity)
                })
                .ToListAsync(cancellationToken);

            var salesOrderLines = await _dbContext.SalesOrderLines
                .Where(line => ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            var impactedSalesOrderIds = salesOrderLines
                .Select(line => line.SOID)
                .Distinct()
                .ToList();

            foreach (var line in salesOrderLines)
            {
                var total = fulfilmentTotals.FirstOrDefault(x => x.SalesOrderLineId == line.Id);

                if (total == null || total.Quantity == 0)
                {
                    line.FulFillQty = null;
                }
                else
                {
                    // SalesOrderLine.FulFillQty is stored as int? in the schema, so we round the decimal quantity
                    line.FulFillQty = (int)Math.Round(total.Quantity, MidpointRounding.AwayFromZero);
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            if (impactedSalesOrderIds.Any())
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

                var linesForOrders = await _dbContext.SalesOrderLines
                    .Where(line => !line.IsDeleted && impactedSalesOrderIds.Contains(line.SOID))
                    .Select(line => new
                    {
                        line.SOID,
                        line.Quantity,
                        line.FulFillQty
                    })
                    .ToListAsync(cancellationToken);

                if (linesForOrders.Any())
                {
                    var ordersFullyFulfilled = new List<Guid>();
                    var ordersNotFullyFulfilled = new List<Guid>();

                    foreach (var group in linesForOrders.GroupBy(line => line.SOID))
                    {
                        var allFulfilled = group.All(line => Convert.ToDecimal(line.FulFillQty ?? 0) >= line.Quantity);
                        if (allFulfilled)
                        {
                            ordersFullyFulfilled.Add(group.Key);
                        }
                        else
                        {
                            ordersNotFullyFulfilled.Add(group.Key);
                        }
                    }

                    if (closedStatusId != Guid.Empty && ordersFullyFulfilled.Any())
                    {
                        var orderEntities = await _dbContext.SalesOrders
                            .Where(order => ordersFullyFulfilled.Contains(order.Id))
                            .ToListAsync(cancellationToken);

                        foreach (var order in orderEntities)
                        {
                            order.Status = closedStatusId;
                        }
                    }

                    if (openStatusId != Guid.Empty && ordersNotFullyFulfilled.Any())
                    {
                        var orderEntities = await _dbContext.SalesOrders
                            .Where(order => ordersNotFullyFulfilled.Contains(order.Id))
                            .ToListAsync(cancellationToken);

                        foreach (var order in orderEntities)
                        {
                            order.Status = openStatusId;
                        }
                    }

                    if ((closedStatusId != Guid.Empty && ordersFullyFulfilled.Any()) ||
                        (openStatusId != Guid.Empty && ordersNotFullyFulfilled.Any()))
                    {
                        await _dbContext.SaveChangesAsync(cancellationToken);
                    }
                }
            }

            return Unit.Value;
        }
    }
}
