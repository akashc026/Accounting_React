using Accounting.API.Contracts;
using Accounting.Application.Features;
using Accounting.Application.Services;
using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.API.Services
{
    /// <summary>
    /// Orchestrates debit memo merge operations in a transaction.
    /// </summary>
    public class DebitMemoMergeService
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalService;

        public DebitMemoMergeService(AccountingDbContext dbContext, IMediator mediator, IJournalGenerationService journalService)
        {
            _dbContext = dbContext;
            _mediator = mediator;
            _journalService = journalService;
        }

        public async Task<Guid> MergeAsync(DebitMemoMergeRequest request, bool isUpdateRequest, CancellationToken cancellationToken = default)
        {
            if (request?.Record == null)
            {
                throw new ArgumentException("Record payload is required.", nameof(request));
            }

            var record = request.Record;
            var isCreate = !record.Id.HasValue || record.Id == Guid.Empty;
            var tranDate = record.TranDate ?? DateTime.UtcNow;

            // Auto-calculate monetary fields from lines and enforce amount due/paid rules
            if (!isCreate)
            {
                var existing = await _dbContext.DebitMemos.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == record.Id!.Value, cancellationToken);
                if (existing == null)
                {
                    throw new KeyNotFoundException($"Debit memo {record.Id} not found.");
                }

                record.Form ??= existing.Form;
                record.CustomerID ??= existing.CustomerID;
                record.LocationID ??= existing.LocationID;
                record.TranDate ??= existing.TranDate;
                record.Status ??= existing.Status;
            }

            var totals = ApplyDebitMemoHeaderTotals(record, request.Items, isUpdateRequest);

            // Preview journal before DB work
            await PreviewJournalAsync(record, request.Items, totals, isCreate, cancellationToken);

            if (isCreate && isUpdateRequest)
            {
                throw new InvalidOperationException("Use POST /debit-memo/merge to create debit memos.");
            }

            if (isCreate)
            {
                if (!record.Form.HasValue || record.Form == Guid.Empty)
                    throw new InvalidOperationException("Form is required to create a debit memo.");
                if (!record.CustomerID.HasValue || !record.LocationID.HasValue)
                    throw new InvalidOperationException("CustomerID and LocationID are required to create a debit memo.");
            }
            else if (!record.Id.HasValue || record.Id == Guid.Empty)
            {
                throw new InvalidOperationException("Debit memo ID is required for update.");
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var debitMemoId = isCreate
                ? await CreateAsync(record, tranDate, cancellationToken)
                : await UpdateAsync(record, cancellationToken);

            await MergeLinesAsync(debitMemoId, request.Items, record.CreatedBy, cancellationToken);
            await MergeCustomFieldsAsync(debitMemoId, request.CustomFields, record.CreatedBy, cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            // Persist journal after commit
            await CreateJournalAsync(debitMemoId, record, request.Items, totals, isCreate, cancellationToken);

            return debitMemoId;
        }

        private async Task<Guid> CreateAsync(DebitMemoMergeRecordDto record, DateTime tranDate, CancellationToken cancellationToken)
        {
            var createCommand = new CreateDebitMemo
            {
                CustomerID = record.CustomerID!.Value,
                LocationID = record.LocationID!.Value,
                TranDate = tranDate,
                TotalAmount = record.TotalAmount ?? 0,
                Form = record.Form!.Value,
                AmountDue = record.AmountDue,
                AmountPaid = record.AmountPaid,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal,
                Status = record.Status,
                CreatedBy = record.CreatedBy
            };

            return await _mediator.Send(createCommand, cancellationToken);
        }

        private async Task<Guid> UpdateAsync(DebitMemoMergeRecordDto record, CancellationToken cancellationToken)
        {
            var exists = await _dbContext.DebitMemos.AnyAsync(x => x.Id == record.Id!.Value, cancellationToken);
            if (!exists)
            {
                throw new KeyNotFoundException($"Debit memo with ID {record.Id} not found.");
            }

            var updateCommand = new UpdateDebitMemo
            {
                Id = record.Id!.Value,
                CustomerID = record.CustomerID,
                LocationID = record.LocationID,
                TranDate = record.TranDate,
                TotalAmount = record.TotalAmount,
                Form = record.Form,
                AmountDue = record.AmountDue,
                AmountPaid = record.AmountPaid,
                GrossAmount = record.GrossAmount,
                TaxTotal = record.TaxTotal,
                SubTotal = record.SubTotal,
                NetTotal = record.NetTotal,
                Status = record.Status
            };

            var result = await _mediator.Send(updateCommand, cancellationToken);
            return result == Guid.Empty ? updateCommand.Id : result;
        }

        private async Task MergeLinesAsync(Guid debitMemoId, IEnumerable<DebitMemoMergeLineDto>? items, string? createdBy, CancellationToken cancellationToken)
        {
            var lineItems = items?.ToList() ?? new List<DebitMemoMergeLineDto>();

            // Delete any existing lines missing from payload or explicitly flagged deleted
            var existingIds = await _dbContext.DebitMemoLines
                .Where(l => l.DebitMemoId == debitMemoId)
                .Select(l => l.Id)
                .ToListAsync(cancellationToken);

            var payloadIds = lineItems.Where(i => i.Id.HasValue && i.Id != Guid.Empty).Select(i => i.Id!.Value).ToList();
            var explicitDeleteIds = lineItems
                .Where(i => i.IsDeleted == true && i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => i.Id!.Value)
                .ToList();

            var missingIds = existingIds.Except(payloadIds).ToList();
            var idsToDelete = missingIds.Concat(explicitDeleteIds).Distinct().ToList();
            if (idsToDelete.Any())
            {
                await _mediator.Send(new DeleteDebitMemoLines { Ids = idsToDelete }, cancellationToken);
                lineItems = lineItems.Where(i => !idsToDelete.Contains(i.Id ?? Guid.Empty) && i.IsDeleted != true).ToList();
            }

            if (!lineItems.Any())
            {
                return;
            }

            var createLines = lineItems
                .Where(i => (!i.Id.HasValue || i.Id == Guid.Empty) && i.IsDeleted != true)
                .Select(i => new DebitMemoLineCreateDto
                {
                    DebitMemoId = debitMemoId,
                    ItemID = i.ItemID,
                    Quantity = i.Quantity,
                    Rate = i.Rate,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount
                })
                .ToList();

            if (createLines.Any())
            {
                await _mediator.Send(new CreateDebitMemoLines
                {
                    CreatedBy = createdBy,
                    Lines = createLines
                }, cancellationToken);
            }

            var updateLines = lineItems
                .Where(i => i.Id.HasValue && i.Id != Guid.Empty)
                .Select(i => new DebitMemoLineUpdateDto
                {
                    Id = i.Id!.Value,
                    DebitMemoId = debitMemoId,
                    ItemID = i.ItemID,
                    Quantity = i.Quantity,
                    Rate = i.Rate,
                    TaxID = i.TaxID,
                    TaxPercent = i.TaxPercent,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    IsDeleted = i.IsDeleted
                })
                .ToList();

            if (updateLines.Any())
            {
                await _mediator.Send(new UpdateDebitMemoLines
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

        private static DebitMemoHeaderTotals ApplyDebitMemoHeaderTotals(DebitMemoMergeRecordDto record, IEnumerable<DebitMemoMergeLineDto>? items, bool isUpdate)
        {
            var totals = CalculateDebitMemoTotals(items);

            record.GrossAmount = totals.GrossAmount;
            record.TaxTotal = totals.TaxTotal;
            record.SubTotal = totals.SubTotal;
            record.NetTotal = totals.NetTotal;
            record.TotalAmount = totals.TotalAmount;

            // AmountPaid is forced to 0 in edit, amountDue mirrors total
            record.AmountPaid = isUpdate ? 0m : record.AmountPaid ?? 0m;
            record.AmountDue = totals.TotalAmount;

            return totals;
        }

        private static DebitMemoHeaderTotals CalculateDebitMemoTotals(IEnumerable<DebitMemoMergeLineDto>? items)
        {
            var gross = 0m;
            var tax = 0m;

            if (items != null)
            {
                foreach (var line in items)
                {
                    var lineGross = line.TotalAmount ?? 0m;
                    if (lineGross == 0m)
                    {
                        lineGross = line.Quantity * line.Rate;
                    }
                    gross += lineGross;

                    var lineTax = line.TaxAmount ?? 0m;
                    if (lineTax == 0m && line.TaxPercent.HasValue && line.TaxPercent.Value != 0m)
                    {
                        lineTax = Math.Round(lineGross * (line.TaxPercent.Value / 100m), 2, MidpointRounding.AwayFromZero);
                    }
                    tax += lineTax;
                }
            }

            var subTotal = Math.Round(gross, 2, MidpointRounding.AwayFromZero);
            var netTotal = Math.Round(subTotal, 2, MidpointRounding.AwayFromZero);
            var totalAmount = netTotal;

            return new DebitMemoHeaderTotals
            {
                GrossAmount = Math.Round(gross, 2, MidpointRounding.AwayFromZero),
                TaxTotal = Math.Round(tax, 2, MidpointRounding.AwayFromZero),
                SubTotal = subTotal,
                NetTotal = netTotal,
                TotalAmount = totalAmount
            };
        }

        private struct DebitMemoHeaderTotals
        {
            public decimal GrossAmount { get; init; }
            public decimal TaxTotal { get; init; }
            public decimal SubTotal { get; init; }
            public decimal NetTotal { get; init; }
            public decimal TotalAmount { get; init; }
        }

        private async Task PreviewJournalAsync(DebitMemoMergeRecordDto record, IEnumerable<DebitMemoMergeLineDto>? items, DebitMemoHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
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

        private async Task CreateJournalAsync(Guid debitMemoId, DebitMemoMergeRecordDto record, IEnumerable<DebitMemoMergeLineDto>? items, DebitMemoHeaderTotals totals, bool isCreate, CancellationToken cancellationToken)
        {
            if (!record.Form.HasValue || record.Form == Guid.Empty)
            {
                return;
            }

            var process = BuildJournalRequest(record, items, totals, isCreate, debitMemoId);
            var result = await _journalService.ProcessAsync(process, cancellationToken);
            if (!result.IsValid)
            {
                throw new InvalidOperationException(result.ErrorMessage ?? "Journal creation failed.");
            }
        }

        private GenerateJvRequest BuildJournalRequest(DebitMemoMergeRecordDto record, IEnumerable<DebitMemoMergeLineDto>? items, DebitMemoHeaderTotals totals, bool isCreate, Guid? debitMemoId)
        {
            var request = new GenerateJvRequest
            {
                RecordType = "DebitMemo",
                FormId = record.Form ?? Guid.Empty,
                TotalAmount = totals.TotalAmount,
                Discount = 0m,
                OperationType = isCreate ? "new" : "edit",
                RecordId = debitMemoId?.ToString()
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
                        IsTaxApplied = (line.TaxPercent ?? 0m) != 0m
                    });
                }
            }

            return request;
        }
    }
}
