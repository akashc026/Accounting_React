using Accounting.API.Contracts;
using Accounting.Application.Features;
using Accounting.Application.Services;
using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.API.Services
{
    /// <summary>
    /// Orchestrates invoice merge operations (create/update, lines, custom fields, sync) within a single transaction.
    /// Keeps controller thin and centralises status/child handling.
    /// </summary>
    public class InvoiceMergeService
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalService;

        public InvoiceMergeService(AccountingDbContext dbContext, IMediator mediator, IJournalGenerationService journalService)
        {
            _dbContext = dbContext;
            _mediator = mediator;
            _journalService = journalService;
        }

        public async Task<Guid> MergeAsync(InvoiceMergeRequest request, bool isUpdateRequest, CancellationToken cancellationToken = default)
        {
            if (request?.Record == null)
            {
                throw new ArgumentException("Record payload is required.", nameof(request));
            }

            var record = request.Record;
            var isCreate = !record.Id.HasValue || record.Id == Guid.Empty;
            var invoiceDate = record.InvoiceDate ?? DateTime.UtcNow;

            if (!isCreate)
            {
                // Backfill required fields for update when payload is partial
                var existing = await _dbContext.Invoices.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == record.Id!.Value, cancellationToken);
                if (existing == null)
                {
                    throw new KeyNotFoundException($"Invoice {record.Id} not found.");
                }

                record.Form ??= existing.Form;
                record.CustomerID ??= existing.CustomerID;
                record.LocationID ??= existing.LocationID;
                record.InvoiceDate ??= existing.InvoiceDate;
                record.Status ??= existing.Status;
            }

            // Build effective lines set (prefer request payload, fallback to existing when null)
            var effectiveLines = await BuildEffectiveLinesAsync(record, request.Items, isCreate, cancellationToken);
            var totals = ApplyInvoiceHeaderTotals(record, effectiveLines, isUpdateRequest);

            // Preview journal (validation) before we touch the DB
            await PreviewJournalAsync(record, effectiveLines, totals, isCreate, cancellationToken);

            if (isCreate && isUpdateRequest)
            {
                throw new InvalidOperationException("Use POST /invoice/merge to create invoices.");
            }

            if (isCreate)
            {
                if (!record.Form.HasValue)
                {
                    throw new InvalidOperationException("Form is required to create an invoice.");
                }

                if (!record.CustomerID.HasValue || !record.LocationID.HasValue)
                {
                    throw new InvalidOperationException("CustomerID and LocationID are required to create an invoice.");
                }
            }
            else if (!record.Id.HasValue || record.Id == Guid.Empty)
            {
                throw new InvalidOperationException("Invoice ID is required for update.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var invoiceId = isCreate
                ? await CreateInvoiceAsync(record, invoiceDate, cancellationToken)
                : await UpdateInvoiceAsync(record, cancellationToken);

            await MergeInvoiceLinesAsync(invoiceId, request.Items, record.CreatedBy, cancellationToken);
            await MergeCustomFieldsAsync(invoiceId, request.CustomFields, record.CreatedBy, cancellationToken);

            await _mediator.Send(new SyncItemFulfilmentInvoicedQuantities { InvoiceId = invoiceId }, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            // After successful commit, persist the journal entry using effective lines
            await CreateJournalAsync(invoiceId, record, effectiveLines, totals, isCreate, cancellationToken);

            return invoiceId;
        }

        private async Task<Guid> CreateInvoiceAsync(InvoiceMergeRecordDto record, DateTime invoiceDate, CancellationToken cancellationToken)
        {
            var createCommand = new CreateInvoice
            {
                CustomerID = record.CustomerID!.Value,
                LocationID = record.LocationID!.Value,
                InvoiceDate = invoiceDate,
                TotalAmount = record.TotalAmount ?? 0,
                Status = record.Status,
                DNID = record.DNID,
                Inactive = record.Inactive,
                Discount = record.Discount,
                Form = record.Form!.Value,
                AmountDue = record.AmountDue,
                AmountPaid = record.AmountPaid,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal,
                CreatedBy = record.CreatedBy
            };

            return await _mediator.Send(createCommand, cancellationToken);
        }

        private async Task<Guid> UpdateInvoiceAsync(InvoiceMergeRecordDto record, CancellationToken cancellationToken)
        {
            var updateCommand = new UpdateInvoice
            {
                Id = record.Id!.Value,
                CustomerID = record.CustomerID,
                LocationID = record.LocationID,
                InvoiceDate = record.InvoiceDate,
                TotalAmount = record.TotalAmount,
                Status = record.Status,
                DNID = record.DNID,
                Inactive = record.Inactive,
                Discount = record.Discount,
                Form = record.Form,
                AmountDue = record.AmountDue,
                AmountPaid = record.AmountPaid,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal
            };

            var result = await _mediator.Send(updateCommand, cancellationToken);
            return result == Guid.Empty ? updateCommand.Id : result;
        }

        private async Task MergeInvoiceLinesAsync(Guid invoiceId, IEnumerable<InvoiceMergeLineDto>? items, string? createdBy, CancellationToken cancellationToken)
        {
            var payloadLines = items?.ToList() ?? new List<InvoiceMergeLineDto>();

            // Deletions: any existing ids missing from payload, plus any explicitly marked deleted
            var existingIds = await _dbContext.InvoiceLines
                .Where(l => l.INID == invoiceId)
                .Select(l => l.Id)
                .ToListAsync(cancellationToken);

            var payloadIds = payloadLines.Where(l => l.Id.HasValue && l.Id != Guid.Empty).Select(l => l.Id!.Value).ToList();
            var explicitDeleteIds = payloadLines
                .Where(l => l.IsDeleted == true && l.Id.HasValue && l.Id != Guid.Empty)
                .Select(l => l.Id!.Value)
                .ToList();

            var missingIds = existingIds.Except(payloadIds).ToList();
            var idsToDelete = missingIds.Concat(explicitDeleteIds).Distinct().ToList();
            if (idsToDelete.Any())
            {
                await _mediator.Send(new DeleteInvoiceLines { Ids = idsToDelete }, cancellationToken);
                // Remove deleted items from local payload so we don't recreate
                payloadLines = payloadLines.Where(l => !idsToDelete.Contains(l.Id ?? Guid.Empty) && l.IsDeleted != true).ToList();
            }

            if (!payloadLines.Any())
            {
                return;
            }

            var createLines = payloadLines
                .Where(i => (!i.Id.HasValue || i.Id == Guid.Empty) && i.IsDeleted != true)
                .Select(i => new InvoiceLineCreateDto
                {
                    INID = invoiceId,
                    ItemID = i.ItemID,
                    QuantityDelivered = i.QuantityDelivered,
                    Rate = i.Rate,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxRate = i.TaxRate,
                    TotalAmount = i.TotalAmount,
                    ItemFulfillmentLineId = i.ItemFulfillmentLineId
                })
                .ToList();

            if (createLines.Any())
            {
                await _mediator.Send(new CreateInvoiceLines { CreatedBy = createdBy, Lines = createLines }, cancellationToken);
            }

            var updateLines = payloadLines
                .Where(i => i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => new InvoiceLineUpdateDto
                {
                    Id = i.Id!.Value,
                    INID = invoiceId,
                    ItemID = i.ItemID,
                    QuantityDelivered = i.QuantityDelivered,
                    Rate = i.Rate,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxRate = i.TaxRate,
                    TotalAmount = i.TotalAmount,
                    ItemFulfillmentLineId = i.ItemFulfillmentLineId,
                    IsDeleted = i.IsDeleted
                })
                .ToList();

            if (updateLines.Any())
            {
                await _mediator.Send(new UpdateInvoiceLines { Lines = updateLines }, cancellationToken);
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

        private static InvoiceHeaderTotals ApplyInvoiceHeaderTotals(InvoiceMergeRecordDto record, IEnumerable<InvoiceLineCalc> lines, bool isUpdate)
        {
            var discount = record.Discount ?? 0m;
            var totals = CalculateInvoiceTotals(lines, discount);

            record.GrossAmount = totals.GrossAmount;
            record.TaxTotal = totals.TaxTotal;
            record.SubTotal = totals.SubTotal;
            record.NetTotal = totals.NetTotal;
            record.TotalAmount = totals.TotalAmount;

            // AmountPaid always zeroed for update (per requirement), and amountDue mirrors total
            record.AmountPaid = isUpdate ? 0m : record.AmountPaid ?? 0m;
            record.AmountDue = totals.TotalAmount;

            return totals;
        }

        private static InvoiceHeaderTotals CalculateInvoiceTotals(IEnumerable<InvoiceLineCalc> items, decimal discount)
        {
            var gross = 0m;
            var tax = 0m;

            foreach (var line in items)
            {
                var lineTotal = line.TotalAmount;
                if (lineTotal == 0m)
                {
                    // fallback when totalAmount not provided
                    lineTotal = line.QuantityDelivered * line.Rate;
                }
                gross += lineTotal;

                var lineTax = line.TaxRate;
                if (lineTax == 0m && line.TaxPercent != 0m)
                {
                    lineTax = Math.Round(lineTotal * (line.TaxPercent / 100m), 2, MidpointRounding.AwayFromZero);
                }
                tax += lineTax;
            }

            // Subtotal is gross less discount; Net/Total mirrors total unless recalculated
            var subTotal = Math.Round(gross - discount, 2, MidpointRounding.AwayFromZero);
            var netTotal = Math.Round(subTotal, 2, MidpointRounding.AwayFromZero);
            var totalAmount = netTotal;

            return new InvoiceHeaderTotals
            {
                GrossAmount = Math.Round(gross, 2, MidpointRounding.AwayFromZero),
                TaxTotal = Math.Round(tax, 2, MidpointRounding.AwayFromZero),
                SubTotal = subTotal,
                NetTotal = netTotal,
                TotalAmount = totalAmount
            };
        }

        private struct InvoiceHeaderTotals
        {
            public decimal GrossAmount { get; init; }
            public decimal TaxTotal { get; init; }
            public decimal SubTotal { get; init; }
            public decimal NetTotal { get; init; }
            public decimal TotalAmount { get; init; }
        }

        private async Task PreviewJournalAsync(InvoiceMergeRecordDto record, IEnumerable<InvoiceLineCalc> lines, InvoiceHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
        {
            if (!record.Form.HasValue || record.Form == Guid.Empty)
            {
                // Form is required for JV generation
                return;
            }

            var previewRequest = BuildJournalRequest(record, lines, totals, isCreate, record.Id);
            var previewResult = await _journalService.GenerateAsync(previewRequest, cancellationToken);
            if (!previewResult.IsValid)
            {
                throw new InvalidOperationException(previewResult.ErrorMessage ?? "Journal preview failed.");
            }
        }

        private async Task CreateJournalAsync(Guid invoiceId, InvoiceMergeRecordDto record, IEnumerable<InvoiceLineCalc> lines, InvoiceHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
        {
            if (!record.Form.HasValue || record.Form == Guid.Empty)
            {
                return;
            }

            var processRequest = BuildJournalRequest(record, lines, totals, isCreate, invoiceId);
            var processResult = await _journalService.ProcessAsync(processRequest, cancellationToken);
            if (!processResult.IsValid)
            {
                throw new InvalidOperationException(processResult.ErrorMessage ?? "Journal creation failed.");
            }
        }

        private GenerateJvRequest BuildJournalRequest(InvoiceMergeRecordDto record, IEnumerable<InvoiceLineCalc> items, InvoiceHeaderTotals totals, bool isCreate, Guid? invoiceId)
        {
            // Per requirement, always treat as "new" for journal processing (create/replace)
            var jvRequest = new GenerateJvRequest
            {
                RecordType = "Invoice",
                FormId = record.Form ?? Guid.Empty,
                TotalAmount = totals.TotalAmount,
                Discount = record.Discount ?? 0m,
                OperationType = "new",
                RecordId = invoiceId?.ToString()
            };

            foreach (var line in items)
            {
                jvRequest.LineItems.Add(new LineItemDto
                {
                    ItemId = line.ItemId,
                    TaxId = line.TaxId,
                    QuantityDelivered = line.QuantityDelivered,
                    Rate = line.Rate,
                    TaxAmount = line.TaxRate,
                    TaxRate = line.TaxRate,
                    IsTaxApplied = line.TaxPercent != 0
                });
            }

            return jvRequest;
        }

        private async Task<List<InvoiceLineCalc>> BuildEffectiveLinesAsync(InvoiceMergeRecordDto record, IEnumerable<InvoiceMergeLineDto>? requestItems, bool isCreate, CancellationToken cancellationToken)
        {
            var payload = requestItems?.Where(i => i.IsDeleted != true).ToList();
            if (payload != null && payload.Any())
            {
                return payload.Select(dto => new InvoiceLineCalc
                {
                    Id = dto.Id,
                    ItemId = dto.ItemID,
                    TaxId = dto.TaxID,
                    QuantityDelivered = dto.QuantityDelivered,
                    Rate = dto.Rate,
                    TaxPercent = dto.TaxPercent,
                    TaxRate = dto.TaxRate,
                    TotalAmount = dto.TotalAmount
                }).ToList();
            }

            // Fallback: no payload lines supplied, use existing
            if (!isCreate && record.Id.HasValue && record.Id != Guid.Empty)
            {
                return await _dbContext.InvoiceLines
                    .Where(l => l.INID == record.Id.Value && !l.IsDeleted)
                    .Select(l => new InvoiceLineCalc
                    {
                        Id = l.Id,
                        ItemId = l.ItemID,
                    TaxId = l.TaxID,
                    QuantityDelivered = l.QuantityDelivered,
                    Rate = l.Rate ?? 0m,
                    TaxPercent = l.TaxPercent,
                    TaxRate = l.TaxRate,
                    TotalAmount = l.TotalAmount
                })
                .ToListAsync(cancellationToken);
        }

            return new List<InvoiceLineCalc>();
        }

        private sealed class InvoiceLineCalc
        {
            public Guid? Id { get; set; }
            public Guid ItemId { get; set; }
            public Guid? TaxId { get; set; }
            public decimal QuantityDelivered { get; set; }
            public decimal Rate { get; set; }
            public decimal TaxPercent { get; set; }
            public decimal TaxRate { get; set; }
            public decimal TotalAmount { get; set; }
        }
    }
}
