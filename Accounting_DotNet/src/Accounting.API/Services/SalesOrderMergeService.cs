using Accounting.API.Contracts;
using Accounting.Application.Features;
using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.API.Services
{
    /// <summary>
    /// Orchestrates sales order merge operations in a transaction.
    /// </summary>
    public class SalesOrderMergeService
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMediator _mediator;

        public SalesOrderMergeService(AccountingDbContext dbContext, IMediator mediator)
        {
            _dbContext = dbContext;
            _mediator = mediator;
        }

        public async Task<Guid> MergeAsync(SalesOrderMergeRequest request, bool isUpdateRequest, CancellationToken cancellationToken = default)
        {
            if (request?.Record == null)
            {
                throw new ArgumentException("Record payload is required.", nameof(request));
            }

            var record = request.Record;
            var isCreate = !record.Id.HasValue || record.Id == Guid.Empty;
            var soDate = record.SODate ?? record.InvoiceDate ?? DateTime.UtcNow;

            // Auto-calculate monetary fields from lines (no header discount for sales orders)
            ApplySalesOrderHeaderTotals(record, request.Items);

            if (isCreate && isUpdateRequest)
            {
                throw new InvalidOperationException("Use POST /sales-order/merge to create sales orders.");
            }

            if (isCreate)
            {
                if (!record.Form.HasValue)
                    throw new InvalidOperationException("Form is required to create a sales order.");
                if (!record.CustomerID.HasValue)
                    throw new InvalidOperationException("CustomerID is required to create a sales order.");
            }
            else if (!record.Id.HasValue || record.Id == Guid.Empty)
            {
                throw new InvalidOperationException("Sales order ID is required for update.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var salesOrderId = isCreate
                ? await CreateAsync(record, soDate, cancellationToken)
                : await UpdateAsync(record, cancellationToken);

            await MergeLinesAsync(salesOrderId, request.Items, record.CreatedBy, cancellationToken);
            await MergeCustomFieldsAsync(salesOrderId, request.CustomFields, record.CreatedBy, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return salesOrderId;
        }

        private async Task<Guid> CreateAsync(SalesOrderMergeRecordDto record, DateTime soDate, CancellationToken cancellationToken)
        {
            var createCommand = new CreateSalesOrder
            {
                CustomerID = record.CustomerID!.Value,
                SODate = soDate,
                Status = record.Status,
                TotalAmount = record.TotalAmount ?? 0,
                LocationID = record.LocationID,
                Form = record.Form!.Value,
                Inactive = record.Inactive,
                Discount = record.Discount,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal,
                CreatedBy = record.CreatedBy
            };

            return await _mediator.Send(createCommand, cancellationToken);
        }

        private async Task<Guid> UpdateAsync(SalesOrderMergeRecordDto record, CancellationToken cancellationToken)
        {
            var exists = await _dbContext.SalesOrders.AnyAsync(x => x.Id == record.Id!.Value, cancellationToken);
            if (!exists)
            {
                throw new KeyNotFoundException($"Sales order with ID {record.Id} not found.");
            }

            var updateCommand = new UpdateSalesOrder
            {
                Id = record.Id!.Value,
                CustomerID = record.CustomerID,
                SODate = record.SODate ?? record.InvoiceDate,
                Status = record.Status,
                TotalAmount = record.TotalAmount,
                LocationID = record.LocationID,
                Form = record.Form,
                SequenceNumber = record.SequenceNumber,
                Inactive = record.Inactive,
                Discount = record.Discount,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal
            };

            var result = await _mediator.Send(updateCommand, cancellationToken);
            return result == Guid.Empty ? updateCommand.Id : result;
        }

        private async Task MergeLinesAsync(Guid salesOrderId, IEnumerable<SalesOrderMergeLineDto>? items, string? createdBy, CancellationToken cancellationToken)
        {
            var itemList = items?.ToList() ?? new List<SalesOrderMergeLineDto>();

            // Delete any existing lines missing from payload or explicitly flagged deleted
            var existingIds = await _dbContext.SalesOrderLines
                .Where(l => l.SOID == salesOrderId)
                .Select(l => l.Id)
                .ToListAsync(cancellationToken);

            var payloadIds = itemList.Where(i => i.Id.HasValue && i.Id != Guid.Empty).Select(i => i.Id!.Value).ToList();
            var explicitDeleteIds = itemList
                .Where(i => i.IsDeleted == true && i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => i.Id!.Value)
                .ToList();

            var missingIds = existingIds.Except(payloadIds).ToList();
            var idsToDelete = missingIds.Concat(explicitDeleteIds).Distinct().ToList();
            if (idsToDelete.Any())
            {
                await _mediator.Send(new DeleteSalesOrderLines { Ids = idsToDelete }, cancellationToken);
                itemList = itemList.Where(i => !idsToDelete.Contains(i.Id ?? Guid.Empty) && i.IsDeleted != true).ToList();
            }

            if (!itemList.Any())
            {
                return;
            }

            var createLines = itemList
                .Where(i => !i.Id.HasValue || i.Id == Guid.Empty)
                .Select(i => new SalesOrderLineCreateDto
                {
                    SOID = salesOrderId,
                    ItemID = i.ItemID,
                    Quantity = i.Quantity,
                    Rate = i.Rate ?? 0,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    FulFillQty = i.FulFillQty
                })
                .ToList();

            if (createLines.Any())
            {
                await _mediator.Send(new CreateSalesOrderLines
                {
                    CreatedBy = createdBy,
                    Lines = createLines
                }, cancellationToken);
            }

            var updateLines = itemList
                .Where(i => i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => new SalesOrderLineUpdateDto
                {
                    Id = i.Id!.Value,
                    SOID = salesOrderId,
                    ItemID = i.ItemID,
                    Quantity = i.Quantity,
                    Rate = i.Rate,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    FulFillQty = i.FulFillQty,
                    IsDeleted = i.IsDeleted
                })
                .ToList();

            if (updateLines.Any())
            {
                await _mediator.Send(new UpdateSalesOrderLines
                {
                    Lines = updateLines
                }, cancellationToken);
            }
        }

        private async Task MergeCustomFieldsAsync(Guid recordId, IEnumerable<SalesOrderMergeCustomFieldDto>? customFields, string? createdBy, CancellationToken cancellationToken)
        {
            if (customFields == null)
            {
                return;
            }

            var fieldList = customFields.ToList();
            if (!fieldList.Any())
            {
                return;
            }

            var recordIdString = recordId.ToString();

            var createValues = fieldList
                .Where(cf => !cf.Id.HasValue || cf.Id == Guid.Empty)
                .Select(cf => new CustomFieldValueCreateDto
                {
                    TypeOfRecord = cf.TypeOfRecord,
                    CustomFieldID = cf.CustomFieldID,
                    ValueText = cf.ValueText,
                    RecordID = recordIdString
                })
                .ToList();

            if (createValues.Any())
            {
                await _mediator.Send(new CreateCustomFieldValues
                {
                    CreatedBy = createdBy,
                    Values = createValues
                }, cancellationToken);
            }

            var updateValues = fieldList
                .Where(cf => cf.Id.HasValue && cf.Id != Guid.Empty)
                .Select(cf => new CustomFieldValueUpdateDto
                {
                    ID = cf.Id!.Value,
                    TypeOfRecord = cf.TypeOfRecord,
                    CustomFieldID = cf.CustomFieldID,
                    ValueText = cf.ValueText,
                    RecordID = recordIdString
                })
                .ToList();

            if (updateValues.Any())
            {
                await _mediator.Send(new UpdateCustomFieldValues
                {
                    Values = updateValues
                }, cancellationToken);
            }
        }

        private static void ApplySalesOrderHeaderTotals(SalesOrderMergeRecordDto record, IEnumerable<SalesOrderMergeLineDto>? items)
        {
            var totals = CalculateTotals(items);

            record.GrossAmount = totals.GrossAmount;
            record.TaxTotal = totals.TaxTotal;
            record.SubTotal = totals.SubTotal;
            record.NetTotal = totals.NetTotal;
            record.TotalAmount = totals.TotalAmount;
        }

        private static SalesOrderHeaderTotals CalculateTotals(IEnumerable<SalesOrderMergeLineDto>? items)
        {
            decimal gross = 0m;
            decimal tax = 0m;

            if (items != null)
            {
                foreach (var line in items)
                {
                    var lineGross = line.TotalAmount;
                    if (lineGross == 0m)
                    {
                        var quantity = line.Quantity;
                        var rate = line.Rate ?? 0m;
                        lineGross = quantity * rate;
                    }
                    gross += lineGross;

                    var lineTax = line.TaxAmount;
                    if (lineTax == 0m && line.TaxPercent != 0m)
                    {
                        lineTax = Math.Round(lineGross * (line.TaxPercent / 100m), 2, MidpointRounding.AwayFromZero);
                    }
                    tax += lineTax;
                }
            }

            var subTotal = Math.Round(gross, 2, MidpointRounding.AwayFromZero);
            var netTotal = Math.Round(subTotal, 2, MidpointRounding.AwayFromZero);

            return new SalesOrderHeaderTotals
            {
                GrossAmount = Math.Round(gross, 2, MidpointRounding.AwayFromZero),
                TaxTotal = Math.Round(tax, 2, MidpointRounding.AwayFromZero),
                SubTotal = subTotal,
                NetTotal = netTotal,
                TotalAmount = netTotal
            };
        }

        private struct SalesOrderHeaderTotals
        {
            public decimal GrossAmount { get; init; }
            public decimal TaxTotal { get; init; }
            public decimal SubTotal { get; init; }
            public decimal NetTotal { get; init; }
            public decimal TotalAmount { get; init; }
        }
    }
}
