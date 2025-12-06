using Accounting.API.Contracts;
using Accounting.Application.Features;
using Accounting.Application.Services;
using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.API.Services
{
    /// <summary>
    /// Orchestrates item fulfilment merge operations in a single transaction.
    /// </summary>
    public class ItemFulfilmentMergeService
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalService;

        public ItemFulfilmentMergeService(AccountingDbContext dbContext, IMediator mediator, IJournalGenerationService journalService)
        {
            _dbContext = dbContext;
            _mediator = mediator;
            _journalService = journalService;
        }

        public async Task<Guid> MergeAsync(ItemFulfilmentMergeRequest request, bool isUpdateRequest, CancellationToken cancellationToken = default)
        {
            if (request?.Record == null)
            {
                throw new ArgumentException("Record payload is required.", nameof(request));
            }

            var record = request.Record;
            var isCreate = !record.Id.HasValue || record.Id == Guid.Empty;
            var deliveryDate = record.DeliveryDate ?? DateTime.UtcNow;

            // Auto-calculate monetary fields from lines (no discount)
            if (!isCreate)
            {
                var existing = await _dbContext.ItemFulfilments.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == record.Id!.Value, cancellationToken);
                if (existing == null)
                {
                    throw new KeyNotFoundException($"Item fulfilment {record.Id} not found.");
                }

                record.Form ??= existing.Form;
                record.CustomerID ??= existing.CustomerID;
                record.LocationID ??= existing.LocationID;
                record.DeliveryDate ??= existing.DeliveryDate;
                record.SOID ??= existing.SOID;
                record.Status ??= existing.Status;
            }

            var totals = ApplyItemFulfilmentHeaderTotals(record, request.Items);

            // Preview journal before any DB changes
            await PreviewJournalAsync(record, request.Items, totals, isCreate, cancellationToken);

            if (isCreate && isUpdateRequest)
            {
                throw new InvalidOperationException("Use POST /itemfulfilment/merge to create item fulfilments.");
            }

            if (isCreate)
            {
                if (!record.Form.HasValue)
                    throw new InvalidOperationException("Form is required to create an item fulfilment.");
                if (!record.CustomerID.HasValue || !record.LocationID.HasValue)
                    throw new InvalidOperationException("CustomerID and LocationID are required to create an item fulfilment.");
            }
            else if (!record.Id.HasValue || record.Id == Guid.Empty)
            {
                throw new InvalidOperationException("Item fulfilment ID is required for update.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var fulfilmentId = isCreate
                ? await CreateAsync(record, deliveryDate, cancellationToken)
                : await UpdateAsync(record, cancellationToken);

            await MergeLinesAsync(fulfilmentId, request.Items, record.CreatedBy, cancellationToken);
            await MergeCustomFieldsAsync(fulfilmentId, request.CustomFields, record.CreatedBy, cancellationToken);

            await _mediator.Send(new SyncSalesOrderFulfillmentQuantities
            {
                ItemFulfilmentId = fulfilmentId
            }, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            // Persist journal after successful commit
            await CreateJournalAsync(fulfilmentId, record, request.Items, totals, isCreate, cancellationToken);

            return fulfilmentId;
        }

        private async Task<Guid> CreateAsync(ItemFulfilmentMergeRecordDto record, DateTime deliveryDate, CancellationToken cancellationToken)
        {
            var createCommand = new CreateItemFulfilment
            {
                SOID = record.SOID,
                DeliveryDate = deliveryDate,
                CustomerID = record.CustomerID!.Value,
                LocationID = record.LocationID!.Value,
                Form = record.Form!.Value,
                Inactive = record.Inactive,
                Discount = record.Discount,
                Status = record.Status,
                InvoicedQty = record.InvoicedQty,
                TotalAmount = record.TotalAmount,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal,
                CreatedBy = record.CreatedBy
            };

            return await _mediator.Send(createCommand, cancellationToken);
        }

        private async Task<Guid> UpdateAsync(ItemFulfilmentMergeRecordDto record, CancellationToken cancellationToken)
        {
            var exists = await _dbContext.ItemFulfilments.AnyAsync(x => x.Id == record.Id!.Value, cancellationToken);
            if (!exists)
            {
                throw new KeyNotFoundException($"Item fulfilment with ID {record.Id} not found.");
            }

            var updateCommand = new UpdateItemFulfilment
            {
                Id = record.Id!.Value,
                SOID = record.SOID,
                DeliveryDate = record.DeliveryDate,
                CustomerID = record.CustomerID,
                LocationID = record.LocationID,
                Form = record.Form,
                Inactive = record.Inactive,
                Discount = record.Discount,
                Status = record.Status,
                InvoicedQty = record.InvoicedQty,
                TotalAmount = record.TotalAmount,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal
            };

            var result = await _mediator.Send(updateCommand, cancellationToken);
            return result == Guid.Empty ? updateCommand.Id : result;
        }

        private async Task MergeLinesAsync(Guid fulfilmentId, IEnumerable<ItemFulfilmentMergeLineDto>? items, string? createdBy, CancellationToken cancellationToken)
        {
            var itemList = items?.ToList() ?? new List<ItemFulfilmentMergeLineDto>();

            // Delete any existing lines missing from payload or explicitly flagged deleted
            var existingIds = await _dbContext.ItemFulfilmentLines
                .Where(l => l.DNID == fulfilmentId)
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
                await _mediator.Send(new DeleteItemFulfilmentLines { Ids = idsToDelete }, cancellationToken);
                itemList = itemList.Where(i => !idsToDelete.Contains(i.Id ?? Guid.Empty) && i.IsDeleted != true).ToList();
            }

            if (!itemList.Any())
            {
                return;
            }

            var createLines = itemList
                .Where(i => (!i.Id.HasValue || i.Id == Guid.Empty) && i.IsDeleted != true)
                .Select(i => new ItemFulfilmentLineCreateDto
                {
                    DNID = fulfilmentId,
                    ItemID = i.ItemID,
                    TaxID = i.TaxID,
                    Quantity = i.Quantity,
                    Rate = i.Rate,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    InvoicedQty = i.InvoicedQty,
                    SalesOrderLineId = i.SalesOrderLineId
                })
                .ToList();

            if (createLines.Any())
            {
                await _mediator.Send(new CreateItemFulfilmentLines
                {
                    CreatedBy = createdBy,
                    Lines = createLines
                }, cancellationToken);
            }

            var updateLines = itemList
                .Where(i => i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => new ItemFulfilmentLineUpdateDto
                {
                    Id = i.Id!.Value,
                    DNID = null, // don't reassign parent FK on update
                    ItemID = i.ItemID,
                    TaxID = i.TaxID,
                    Quantity = i.Quantity,
                    Rate = i.Rate,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    InvoicedQty = i.InvoicedQty,
                    SalesOrderLineId = i.SalesOrderLineId,
                    IsDeleted = i.IsDeleted
                })
                .ToList();

            if (updateLines.Any())
            {
                await _mediator.Send(new UpdateItemFulfilmentLines
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
                .Where(cf => (!cf.Id.HasValue || cf.Id == Guid.Empty) && cf.CustomFieldID != Guid.Empty)
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

        private static ItemFulfilmentHeaderTotals ApplyItemFulfilmentHeaderTotals(ItemFulfilmentMergeRecordDto record, IEnumerable<ItemFulfilmentMergeLineDto>? items)
        {
            var totals = CalculateTotals(items);

            record.GrossAmount = totals.GrossAmount;
            record.TaxTotal = totals.TaxTotal;
            record.SubTotal = totals.SubTotal;
            record.NetTotal = totals.NetTotal;
            record.TotalAmount = totals.TotalAmount;

            return totals;
        }

        private static ItemFulfilmentHeaderTotals CalculateTotals(IEnumerable<ItemFulfilmentMergeLineDto>? items)
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
                        var rate = line.Rate;
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

            return new ItemFulfilmentHeaderTotals
            {
                GrossAmount = Math.Round(gross, 2, MidpointRounding.AwayFromZero),
                TaxTotal = Math.Round(tax, 2, MidpointRounding.AwayFromZero),
                SubTotal = subTotal,
                NetTotal = netTotal,
                TotalAmount = netTotal
            };
        }

        private struct ItemFulfilmentHeaderTotals
        {
            public decimal GrossAmount { get; init; }
            public decimal TaxTotal { get; init; }
            public decimal SubTotal { get; init; }
            public decimal NetTotal { get; init; }
            public decimal TotalAmount { get; init; }
        }

        private async Task PreviewJournalAsync(ItemFulfilmentMergeRecordDto record, IEnumerable<ItemFulfilmentMergeLineDto>? items, ItemFulfilmentHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
        {
            if (!record.Form.HasValue || record.Form == Guid.Empty)
            {
                return;
            }

            var preview = BuildJournalRequest(record, items, totals, isCreate, record.Id);
            var result = await _journalService.GenerateAsync(preview, cancellationToken);
            if (!result.IsValid)
            {
                throw new InvalidOperationException(result.ErrorMessage ?? "Journal preview failed.");
            }
        }

        private async Task CreateJournalAsync(Guid fulfilmentId, ItemFulfilmentMergeRecordDto record, IEnumerable<ItemFulfilmentMergeLineDto>? items, ItemFulfilmentHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
        {
            if (!record.Form.HasValue || record.Form == Guid.Empty)
            {
                return;
            }

            var process = BuildJournalRequest(record, items, totals, isCreate, fulfilmentId);
            var result = await _journalService.ProcessAsync(process, cancellationToken);
            if (!result.IsValid)
            {
                throw new InvalidOperationException(result.ErrorMessage ?? "Journal creation failed.");
            }
        }

        private GenerateJvRequest BuildJournalRequest(ItemFulfilmentMergeRecordDto record, IEnumerable<ItemFulfilmentMergeLineDto>? items, ItemFulfilmentHeaderTotals totals, bool isCreate, Guid? fulfilmentId)
        {
            var request = new GenerateJvRequest
            {
                RecordType = "ItemFulfillment",
                FormId = record.Form ?? Guid.Empty,
                TotalAmount = totals.TotalAmount,
                Discount = 0m,
                OperationType = isCreate ? "new" : "edit",
                RecordId = fulfilmentId?.ToString()
            };

            if (items != null)
            {
                foreach (var line in items)
                {
                    request.LineItems.Add(new LineItemDto
                    {
                        ItemId = line.ItemID,
                        TaxId = line.TaxID,
                        Quantity = line.Quantity,
                        Rate = line.Rate,
                        TaxAmount = line.TaxAmount,
                        TaxRate = line.TaxPercent,
                        IsTaxApplied = line.TaxPercent != 0
                    });
                }
            }

            return request;
        }
    }
}
