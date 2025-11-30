using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Accounting.Persistence;
using Accounting.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Accounting.Application.Services;

public interface IJournalGenerationService
{
    Task<GenerateJvResult> GenerateAsync(GenerateJvRequest request, CancellationToken ct = default);
    Task<GenerateJvResult> ProcessAsync(GenerateJvRequest request, CancellationToken ct = default);
}

/// <summary>
/// DTOs mirroring the React inputs. Keep these lean and serialization-friendly.
/// </summary>
public sealed class GenerateJvRequest
{
    public string RecordType { get; set; } = string.Empty;
    public Guid FormId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal Discount { get; set; }
    public string OperationType { get; set; } = "new"; // new | edit | delete
    public string? RecordId { get; set; }
    public Guid? JournalEntryId { get; set; }
    public List<LineItemDto> LineItems { get; set; } = new();
}

public sealed class LineItemDto
{
    public Guid? ItemId { get; set; }
    public Guid? TaxId { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? QuantityDelivered { get; set; }
    public decimal? QuantityReceived { get; set; }
    public decimal? QuantityAdjusted { get; set; }
    public decimal? Rate { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? TaxRate { get; set; }
    public bool? IsTaxApplied { get; set; }
    public string? Reason { get; set; }
}

public sealed class GeneratedLine
{
    public Guid AccountId { get; set; }
    public decimal NewDebit { get; set; }
    public decimal NewCredit { get; set; }
    public decimal OldDebit { get; set; }
    public decimal OldCredit { get; set; }
    public string Memo { get; set; } = string.Empty;
    public string? RecordId { get; set; }
    public string? RecordType { get; set; }
}

public sealed class GenerateJvResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public List<GeneratedLine> Lines { get; set; } = new();
}

public class JournalGenerationService : IJournalGenerationService
{
    private readonly AccountingDbContext _dbContext;
    private readonly JournalFormTypeSettings _formTypeSettings;

    // Constants used in the JS logic
    private static readonly Guid ItemTypeInventory = Guid.Parse("ef765a67-402b-48ee-b898-8eaa45affb64");

    public JournalGenerationService(AccountingDbContext dbContext, IOptions<JournalFormTypeSettings> formTypeSettings)
    {
        _dbContext = dbContext;
        _formTypeSettings = formTypeSettings?.Value ?? new JournalFormTypeSettings();
        _formTypeSettings.ApplyDefaultsWhenMissing();
    }

    public async Task<GenerateJvResult> GenerateAsync(GenerateJvRequest request, CancellationToken ct = default)
    {
        var form = await _dbContext.Forms.AsNoTracking().FirstOrDefaultAsync(f => f.Id == request.FormId, ct);
        if (form == null)
        {
            return Invalid($"Form {request.FormId} not found.");
        }

        // Preload lookups in bulk to avoid N+1 calls
        var productIds = request.LineItems.Where(x => x.ItemId.HasValue).Select(x => x.ItemId!.Value).Distinct().ToList();
        var taxIds = request.LineItems.Where(x => x.TaxId.HasValue).Select(x => x.TaxId!.Value).Distinct().ToList();

        var products = await _dbContext.Products.AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        var taxes = await _dbContext.Taxes.AsNoTracking()
            .Where(t => taxIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, ct);

        var lines = new List<GeneratedLine>();
        var formKind = GetFormKind(form.FormType, form.FormTypeNavigation?.Name);

        // Common helper to add a line
        void AddLine(Guid? accountId, decimal debit, decimal credit, string memo = "")
        {
            var acct = accountId ?? Guid.Empty;
            lines.Add(new GeneratedLine
            {
                AccountId = acct,
                NewDebit = debit,
                NewCredit = credit,
                OldDebit = 0,
                OldCredit = 0,
                Memo = memo,
                RecordId = request.RecordId,
                RecordType = request.RecordType
            });
        }

        // Compute total tax amount from the payload
        var totalTaxAmount = request.LineItems.Sum(x => x.TaxRate ?? x.TaxAmount ?? 0);

        // Record-type driven logic (ported from the React implementation)
        if (EqualsOrdinal(request.RecordType, "CustomerPayment"))
        {
            AddLine(form.AccountReceivable, 0, request.TotalAmount);
            AddLine(form.UndepositedFunds, request.TotalAmount, 0);
        }

        if (EqualsOrdinal(request.RecordType, "Invoice"))
        {
            // Compute totals server-side only for invoice
            var computedTotalRate = request.LineItems.Sum(x =>
            {
                var qty = x.Quantity ?? x.QuantityDelivered ?? x.QuantityReceived ?? 0;
                var rate = x.Rate ?? 0;
                return qty * rate;
            });

            var computedTotalItemCount = request.LineItems.Count;

            var computedTotalTaxPercent = request.LineItems.Sum(x =>
            {
                if (x.TaxId.HasValue && taxes.TryGetValue(x.TaxId.Value, out var tax))
                {
                    return tax.TaxRate;
                }
                return x.TaxRate ?? 0;
            });

            var isGaapFamily = formKind == FormTypeKind.Gaap || formKind == FormTypeKind.GaapOnDiscount;
            var useGaapOnDiscountFlow = isGaapFamily && request.Discount > 0;

            if (useGaapOnDiscountFlow)
            {
                var totalItemCount = computedTotalItemCount;
                var totalTaxPercent = computedTotalTaxPercent;
                var totalRate = computedTotalRate;

                if (totalItemCount == 0)
                    return Invalid($"Cannot create {request.RecordType}. No line items to apply discount.");

                var averageTax = Round2(totalTaxPercent / totalItemCount);
                var subTotal = Round2(totalRate - request.Discount);
                var calculatedTax = Round2(subTotal * averageTax / 100);
                var netAmount = Round2(subTotal + calculatedTax);
                var taxOnDiscount = Round2(request.Discount * averageTax / 100);
                var perLineDiscount = request.Discount / totalItemCount;

                AddLine(form.AccuredAR, 0, request.TotalAmount);
                AddLine(form.AccuredTax, totalTaxAmount, 0);
                AddLine(form.AccountReceivable, netAmount, 0);
                AddLine(form.DiscountOnTax, request.Discount, 0);
                AddLine(form.DiscountOnTaxDR, taxOnDiscount, 0);
                AddLine(form.DiscountOnTaxCR, 0, taxOnDiscount);

                foreach (var item in request.LineItems)
                {
                    if (!item.TaxId.HasValue || !taxes.TryGetValue(item.TaxId.Value, out var tax)) continue;
                    if (tax.TaxRate <= 0) continue;

                    var quantity = item.Quantity ?? item.QuantityDelivered ?? 0;
                    var rate = item.Rate ?? 0;
                    var lineTotal = quantity * rate;
                    var discountedLine = lineTotal - perLineDiscount;
                    var credit = Round2(discountedLine * averageTax / 100);
                    AddLine(tax.TaxAccount, 0, credit);
                }
            }
            else
            {
                if (request.Discount > 0)
                {
                    var calTotalAmount = Round2(request.TotalAmount - request.Discount);
                    AddLine(form.AccountReceivable, calTotalAmount, 0);
                    AddLine(form.DiscountOnTax, request.Discount, 0);
                }
                else
                {
                    AddLine(form.AccountReceivable, request.TotalAmount, 0);
                }

                if (isGaapFamily)
                {
                    AddLine(form.AccuredAR, 0, request.TotalAmount);
                    AddLine(form.AccuredTax, totalTaxAmount, 0);

                    foreach (var item in request.LineItems)
                    {
                        if (!item.TaxId.HasValue || !taxes.TryGetValue(item.TaxId.Value, out var tax)) continue;
                        if (tax.TaxRate <= 0) continue;
                        AddLine(tax.TaxAccount, 0, item.TaxRate ?? item.TaxAmount ?? 0);
                    }
                }

                if (formKind == FormTypeKind.ExpenseClearing || formKind == FormTypeKind.Service || formKind == FormTypeKind.NonInventory)
                {
                    foreach (var item in request.LineItems)
                    {
                        if (item.ItemId.HasValue && products.TryGetValue(item.ItemId.Value, out var product))
                        {
                            var qty = item.Quantity ?? item.QuantityDelivered ?? 0;
                            var rate = item.Rate ?? 0;
                            var lineTotal = Round2(qty * rate);
                            AddLine(product.SalesAccount, 0, lineTotal);

                            if (formKind != FormTypeKind.NonInventory)
                            {
                                if (product.ItemType == ItemTypeInventory)
                                {
                                    if (!product.AverageCost.HasValue || product.AverageCost.Value <= 0)
                                        return Invalid($"Cannot create {request.RecordType}. Average Cost is Invalid or Zero.");

                                    var cost = product.AverageCost.Value * qty;
                                    AddLine(product.COGSAccount, cost, 0);
                                    var inventoryOrClearing = formKind == FormTypeKind.ExpenseClearing ? form.Clearing : product.InventoryAccount;
                                    AddLine(inventoryOrClearing, 0, cost);
                                }
                                else
                                {
                                    if (!product.StandardCost.HasValue || product.StandardCost.Value <= 0)
                                        return Invalid($"Cannot create {request.RecordType}. Standard Cost is Invalid or Zero.");

                                    var cost = product.StandardCost.Value * qty;
                                    AddLine(product.COGSAccount, cost, 0);
                                    var expenseOrClearing = formKind == FormTypeKind.ExpenseClearing ? form.Clearing : product.ExpenseAccount;
                                    AddLine(expenseOrClearing, 0, cost);
                                }
                            }
                        }

                        if (item.TaxId.HasValue && taxes.TryGetValue(item.TaxId.Value, out var tax))
                        {
                            if (tax.TaxRate > 0)
                            {
                                AddLine(tax.TaxAccount, 0, item.TaxRate ?? item.TaxAmount ?? 0);
                            }
                        }
                    }
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "ItemFulfillment"))
        {
            if (formKind == FormTypeKind.Gaap || formKind == FormTypeKind.GaapOnDiscount)
            {
                AddLine(form.AccuredAR, request.TotalAmount, 0);

                foreach (var item in request.LineItems)
                {
                    if ((item.TaxAmount ?? item.TaxRate ?? 0) > 0)
                    {
                        AddLine(form.AccuredTax, 0, item.TaxAmount ?? item.TaxRate ?? 0);
                    }

                    if (item.ItemId.HasValue && products.TryGetValue(item.ItemId.Value, out var product))
                    {
                        var qty = item.Quantity ?? item.QuantityDelivered ?? 0;
                        var rate = item.Rate ?? 0;
                        var lineTotal = Round2(qty * rate);
                        AddLine(product.SalesAccount, 0, lineTotal);

                        if (product.ItemType == ItemTypeInventory)
                        {
                            if (!product.AverageCost.HasValue || product.AverageCost.Value <= 0)
                                return Invalid($"Cannot create {request.RecordType}. Average Cost is Invalid or Zero.");
                            var cost = product.AverageCost.Value * qty;
                            AddLine(product.COGSAccount, cost, 0);
                            AddLine(product.InventoryAccount, 0, cost);
                        }
                        else
                        {
                            if (!product.StandardCost.HasValue || product.StandardCost.Value <= 0)
                                return Invalid($"Cannot create {request.RecordType}. Standard Cost is Invalid or Zero.");
                            var cost = product.StandardCost.Value * qty;
                            AddLine(product.COGSAccount, cost, 0);
                            AddLine(product.ExpenseAccount, 0, cost);
                        }
                    }
                }
            }

            if (formKind == FormTypeKind.ExpenseClearing)
            {
                foreach (var item in request.LineItems)
                {
                    if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product)) continue;
                    var qty = item.Quantity ?? 0;

                    if (product.ItemType == ItemTypeInventory)
                    {
                        if (!product.AverageCost.HasValue || product.AverageCost.Value <= 0)
                            return Invalid($"Cannot create {request.RecordType}. Average Cost is Invalid or Zero.");
                        var cost = product.AverageCost.Value * qty;
                        AddLine(product.InventoryAccount, 0, cost);
                        AddLine(form.Clearing, cost, 0);
                    }
                    else
                    {
                        if (!product.StandardCost.HasValue || product.StandardCost.Value <= 0)
                            return Invalid($"Cannot create {request.RecordType}. Standard Cost is Invalid or Zero.");
                        var cost = product.StandardCost.Value * qty;
                        AddLine(product.ExpenseAccount, 0, cost);
                        AddLine(form.Clearing, cost, 0);
                    }
                }
            }

            if (formKind == FormTypeKind.NonInventory || formKind == FormTypeKind.Service)
            {
                foreach (var item in request.LineItems)
                {
                    if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product)) continue;
                    var qty = item.Quantity ?? 0;

                    if (product.ItemType == ItemTypeInventory)
                    {
                        if (!product.AverageCost.HasValue || product.AverageCost.Value <= 0)
                            return Invalid($"Cannot create {request.RecordType}. Average Cost is Invalid or Zero.");
                        var cost = product.AverageCost.Value * qty;
                        AddLine(product.COGSAccount, cost, 0);
                        AddLine(product.InventoryAccount, 0, cost);
                    }
                    else
                    {
                        if (!product.StandardCost.HasValue || product.StandardCost.Value <= 0)
                            return Invalid($"Cannot create {request.RecordType}. Standard Cost is Invalid or Zero.");
                        var cost = product.StandardCost.Value * qty;
                        AddLine(product.COGSAccount, cost, 0);
                        AddLine(product.ExpenseAccount, 0, cost);
                    }
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "DebitMemo") || EqualsOrdinal(request.RecordType, "CreditMemo"))
        {
            var isCreditMemo = EqualsOrdinal(request.RecordType, "CreditMemo");
            AddLine(form.AccountReceivable, isCreditMemo ? 0 : request.TotalAmount, isCreditMemo ? request.TotalAmount : 0);

            foreach (var item in request.LineItems)
            {
                if (item.ItemId.HasValue && products.TryGetValue(item.ItemId.Value, out var product))
                {
                    var qty = item.Quantity ?? item.QuantityDelivered ?? 0;
                    var rate = item.Rate ?? 0;
                    var lineTotal = Round2(qty * rate);
                    AddLine(product.SalesAccount, isCreditMemo ? lineTotal : 0, isCreditMemo ? 0 : lineTotal);
                }

                if (item.TaxId.HasValue && taxes.TryGetValue(item.TaxId.Value, out var tax) && tax.TaxRate > 0)
                {
                    var taxAmt = item.TaxAmount ?? item.TaxRate ?? 0;
                    AddLine(tax.TaxAccount, isCreditMemo ? taxAmt : 0, isCreditMemo ? 0 : taxAmt);
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "InventoryAdjustment"))
        {
            foreach (var item in request.LineItems)
            {
                if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product))
                    continue;

                if (string.IsNullOrWhiteSpace(item.Reason) || !item.Reason.Contains("$"))
                    return Invalid($"Cannot create {request.RecordType}. Reason Account is not added.");

                var reasonAccount = item.Reason.Split("$").LastOrDefault();
                if (!Guid.TryParse(reasonAccount, out var reasonAccountId))
                    return Invalid($"Cannot create {request.RecordType}. Reason Account is not valid.");

                var qty = item.QuantityAdjusted ?? 0;
                if (!product.AverageCost.HasValue || product.AverageCost.Value <= 0)
                    return Invalid($"Cannot create {request.RecordType}. Average Cost is Invalid or Zero.");

                var cost = product.AverageCost.Value * Math.Abs(qty);
                if (qty > 0)
                {
                    AddLine(product.InventoryAccount, 0, cost);
                    AddLine(reasonAccountId, cost, 0);
                }
                else
                {
                    AddLine(product.InventoryAccount, cost, 0);
                    AddLine(reasonAccountId, 0, cost);
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "ItemReceipt"))
        {
            var clearingApplied = false;
            foreach (var item in request.LineItems)
            {
                if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product)) continue;

                if (!clearingApplied)
                {
                    if (product.ItemType == ItemTypeInventory)
                        AddLine(form.ClearingGRNI, 0, request.TotalAmount);
                    else
                        AddLine(form.ClearingSRNI, 0, request.TotalAmount);
                    clearingApplied = true;
                }

                var qty = item.QuantityReceived ?? 0;
                var rate = item.Rate ?? 0;
                var lineTotal = Round2(qty * rate);
                var taxAmt = item.TaxAmount ?? item.TaxRate ?? 0;

                if (taxAmt > 0)
                {
                    AddLine(product.InventoryAccount, lineTotal, 0);
                    AddLine(form.ClearingVAT, taxAmt, 0);
                }
                else
                {
                    AddLine(product.InventoryAccount, request.TotalAmount, 0);
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "VendorBill"))
        {
            var clearingApplied = false;
            foreach (var item in request.LineItems)
            {
                if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product)) continue;

                if (!clearingApplied)
                {
                    AddLine(form.AccountPayable, 0, request.TotalAmount);
                    if (product.ItemType == ItemTypeInventory)
                        AddLine(form.ClearingGRNI, request.TotalAmount, 0);
                    else
                        AddLine(form.ClearingSRNI, request.TotalAmount, 0);
                    clearingApplied = true;
                }

                if (item.TaxId.HasValue && taxes.TryGetValue(item.TaxId.Value, out var tax))
                {
                    var taxAmt = item.TaxAmount ?? item.TaxRate ?? 0;
                    var isTaxApplied = item.IsTaxApplied ?? false;
                    if (tax.TaxRate > 0)
                    {
                        if (isTaxApplied)
                        {
                            AddLine(form.ClearingVAT, 0, taxAmt);
                            AddLine(tax.TaxAccount, taxAmt, 0);
                        }
                        else
                        {
                            AddLine(tax.TaxAccount, taxAmt, 0);
                        }
                    }
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "VendorCredit"))
        {
            foreach (var item in request.LineItems)
            {
                if (!item.ItemId.HasValue || !products.TryGetValue(item.ItemId.Value, out var product)) continue;
                var qty = item.Quantity ?? item.QuantityDelivered ?? 0;
                var rate = item.Rate ?? 0;
                var lineTotal = Round2(qty * rate);

                AddLine(form.AccountPayable, request.TotalAmount, 0);
                AddLine(product.InventoryAccount, 0, lineTotal);

                if (item.TaxId.HasValue && taxes.TryGetValue(item.TaxId.Value, out var tax) && tax.TaxRate > 0)
                {
                    AddLine(tax.TaxAccount, item.TaxRate ?? item.TaxAmount ?? 0, 0);
                }
            }
        }

        if (EqualsOrdinal(request.RecordType, "VendorPayment"))
        {
            AddLine(form.AccountPayable, request.TotalAmount, 0);
            AddLine(form.UndepositedFunds, 0, request.TotalAmount);
        }

        // Validation for missing account ids
        var missingAccounts = lines.Where(l => l.AccountId == Guid.Empty).ToList();
        if (missingAccounts.Any())
        {
            return Invalid($"Cannot create {request.RecordType}. Some required accounts are not configured in the selected form. Please configure all required accounts before proceeding.");
        }

        return new GenerateJvResult
        {
            IsValid = true,
            Lines = lines
        };
    }

    public async Task<GenerateJvResult> ProcessAsync(GenerateJvRequest request, CancellationToken ct = default)
    {
        var op = (request.OperationType ?? "new").Trim().ToLowerInvariant();
        var recordId = request.RecordId ?? string.Empty;

        // Fetch existing lines for edit/delete to compute deltas and replace data
        var existingLines = await _dbContext.JournalEntryLines
            .Where(l => l.RecordID == recordId && l.RecordType == request.RecordType)
            .ToListAsync(ct);

        // Group deltas by account
        var deltaByAccount = new Dictionary<Guid, decimal>();

        decimal GetNet(decimal credit, decimal debit) => credit - debit;

        // If delete, skip regeneration/validation: just soft-delete and reverse balances
        if (op == "delete")
        {
            foreach (var line in existingLines)
            {
                var net = GetNet(line.Credit ?? 0, line.Debit ?? 0);
                AddDelta(deltaByAccount, line.Account ?? Guid.Empty, -net);
                line.IsDeleted = true;
            }

            await ApplyBalanceUpdatesAsync(deltaByAccount, ct);
            await _dbContext.SaveChangesAsync(ct);

            return new GenerateJvResult
            {
                IsValid = true,
                Lines = new List<GeneratedLine>(),
                ErrorMessage = null
            };
        }

        // For new/edit operations, generate and validate lines
        var generated = await GenerateAsync(request, ct);
        if (!generated.IsValid)
        {
            return generated;
        }

        // Fetch existing lines for edit/delete to compute deltas and replace data
        // For edit, remove all old lines and reinsert fresh ones to keep logic simple and consistent
        if (existingLines.Any())
        {
            foreach (var line in existingLines)
            {
                var net = GetNet(line.Credit ?? 0, line.Debit ?? 0);
                AddDelta(deltaByAccount, line.Account ?? Guid.Empty, -net);
            }
            _dbContext.JournalEntryLines.RemoveRange(existingLines);
        }

        foreach (var gl in generated.Lines)
        {
            var entity = new JournalEntryLine
            {
                Id = Guid.NewGuid(),
                Account = gl.AccountId,
                Debit = gl.NewDebit,
                Credit = gl.NewCredit,
                Memo = gl.Memo,
                RecordID = gl.RecordId ?? request.RecordId,
                RecordType = gl.RecordType ?? request.RecordType,
                JEID = request.JournalEntryId,
                CreatedBy = "system",
                CreatedDate = DateTime.UtcNow,
                IsDeleted = false
            };
            _dbContext.JournalEntryLines.Add(entity);

            var net = GetNet(gl.NewCredit, gl.NewDebit);
            AddDelta(deltaByAccount, gl.AccountId, net);
        }

        // Apply running balance updates in bulk
        await ApplyBalanceUpdatesAsync(deltaByAccount, ct);

        await _dbContext.SaveChangesAsync(ct);
        return generated;
    }

    private async Task ApplyBalanceUpdatesAsync(Dictionary<Guid, decimal> deltaByAccount, CancellationToken ct)
    {
        if (deltaByAccount.Count == 0) return;

        var updates = deltaByAccount
            .Select(kv => new { AccountId = kv.Key, Delta = kv.Value })
            .ToList();

        foreach (var update in updates)
        {
            await _dbContext.ChartOfAccounts
                .Where(a => a.Id == update.AccountId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.RunningBalance,
                    a => (a.RunningBalance ?? 0) + update.Delta), ct);
        }
    }

    private static void AddDelta(IDictionary<Guid, decimal> map, Guid accountId, decimal delta)
    {
        if (accountId == Guid.Empty) return;
        if (!map.ContainsKey(accountId)) map[accountId] = 0;
        map[accountId] += delta;
    }

    private FormTypeKind GetFormKind(Guid? formTypeId, string? formTypeName)
    {
        if (formTypeId.HasValue)
        {
            if (formTypeId.Value == _formTypeSettings.Gaap) return FormTypeKind.Gaap;
            if (formTypeId.Value == _formTypeSettings.GaapOnDiscount) return FormTypeKind.GaapOnDiscount;
            if (formTypeId.Value == _formTypeSettings.ExpenseClearing) return FormTypeKind.ExpenseClearing;
            if (formTypeId.Value == _formTypeSettings.Service) return FormTypeKind.Service;
            if (formTypeId.Value == _formTypeSettings.NonInventory) return FormTypeKind.NonInventory;
        }

        // Fallback by name if ids are different but names are standardized
        if (!string.IsNullOrWhiteSpace(formTypeName))
        {
            var name = formTypeName.Trim();
            if (name.Equals("GAAP", StringComparison.OrdinalIgnoreCase)) return FormTypeKind.Gaap;
            if (name.Equals("GAAP_ON_DISCOUNT", StringComparison.OrdinalIgnoreCase) || name.Equals("GAAP on Discount", StringComparison.OrdinalIgnoreCase)) return FormTypeKind.GaapOnDiscount;
            if (name.Contains("expense", StringComparison.OrdinalIgnoreCase) && name.Contains("clearing", StringComparison.OrdinalIgnoreCase)) return FormTypeKind.ExpenseClearing;
            if (name.Contains("service", StringComparison.OrdinalIgnoreCase)) return FormTypeKind.Service;
            if (name.Contains("non", StringComparison.OrdinalIgnoreCase) && name.Contains("inventory", StringComparison.OrdinalIgnoreCase)) return FormTypeKind.NonInventory;
        }

        return FormTypeKind.Unknown;
    }

    private static GenerateJvResult Invalid(string message) => new()
    {
        IsValid = false,
        ErrorMessage = message,
        Lines = new List<GeneratedLine>()
    };

    private static bool EqualsOrdinal(string? a, string b) =>
        string.Equals(a?.Trim(), b, StringComparison.OrdinalIgnoreCase);

    private static decimal Round2(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}

public enum FormTypeKind
{
    Unknown = 0,
    Gaap = 1,
    GaapOnDiscount = 2,
    ExpenseClearing = 3,
    Service = 4,
    NonInventory = 5
}

/// <summary>
/// Configurable mapping for form types to behaviors, avoiding hard-coded GUIDs in logic.
/// </summary>
public class JournalFormTypeSettings
{
    public Guid Gaap { get; set; }
    public Guid GaapOnDiscount { get; set; }
    public Guid ExpenseClearing { get; set; }
    public Guid Service { get; set; }
    public Guid NonInventory { get; set; }

    internal void ApplyDefaultsWhenMissing()
    {
        if (Gaap == Guid.Empty) Gaap = Guid.Parse("3e7a690c-dd04-4254-89f6-58e85139c07d");
        if (GaapOnDiscount == Guid.Empty) GaapOnDiscount = Guid.Parse("a34b6525-52d9-4915-a095-65ec36d4b0f2");
        if (ExpenseClearing == Guid.Empty) ExpenseClearing = Guid.Parse("9d19694e-dac4-4840-a29b-c1e1be0d82f0");
        if (Service == Guid.Empty) Service = Guid.Parse("3ddc355d-d7e9-4ae3-bdb5-386012fd9a6f");
        if (NonInventory == Guid.Empty) NonInventory = Guid.Parse("69a5b24f-0bd4-4f80-adf1-a03bfb7531a8");
    }
}
