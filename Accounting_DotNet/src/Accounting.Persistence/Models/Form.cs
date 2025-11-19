using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class Form : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string FormName { get; set; } = null!;

    public Guid TypeOfRecord { get; set; }

    public string? Prefix { get; set; }

    public string? Reasons { get; set; }

    public Guid? AccountPayable { get; set; }

    public Guid? AccountReceivable { get; set; }

    public Guid? AccuredTax { get; set; }

    public Guid? AccuredAR { get; set; }

    public Guid? DiscountOnTax { get; set; }

    public Guid? FormType { get; set; }

    public Guid? UndepositedFunds { get; set; }

    public Guid? ClearingGRNI { get; set; }

    public Guid? ClearingSRNI { get; set; }

    public Guid? ClearingVAT { get; set; }

    public Guid? Clearing { get; set; }

    public bool? IsDefault { get; set; }

    public bool? Inactive { get; set; }

    public Guid? DiscountOnTaxDR { get; set; }

    public Guid? DiscountOnTaxCR { get; set; }

    public virtual ChartOfAccount? AccountPayableNavigation { get; set; }

    public virtual ChartOfAccount? AccountReceivableNavigation { get; set; }

    public virtual ChartOfAccount? AccuredARNavigation { get; set; }

    public virtual ChartOfAccount? AccuredTaxNavigation { get; set; }

    public virtual ChartOfAccount? ClearingGRNINavigation { get; set; }

    public virtual ChartOfAccount? ClearingNavigation { get; set; }

    public virtual ChartOfAccount? ClearingSRNINavigation { get; set; }

    public virtual ChartOfAccount? ClearingVATNavigation { get; set; }

    public virtual ICollection<CreditMemo> CreditMemos { get; set; } = new List<CreditMemo>();

    public virtual ICollection<CustomFormField> CustomFormFields { get; set; } = new List<CustomFormField>();

    public virtual ICollection<CustomerPayment> CustomerPayments { get; set; } = new List<CustomerPayment>();

    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public virtual ICollection<DebitMemo> DebitMemos { get; set; } = new List<DebitMemo>();

    public virtual ChartOfAccount? DiscountOnTaxCRNavigation { get; set; }

    public virtual ChartOfAccount? DiscountOnTaxDRNavigation { get; set; }

    public virtual ChartOfAccount? DiscountOnTaxNavigation { get; set; }

    public virtual ICollection<FormSequence> FormSequences { get; set; } = new List<FormSequence>();

    public virtual FormSourceType? FormTypeNavigation { get; set; }

    public virtual ICollection<InventoryAdjustment> InventoryAdjustments { get; set; } = new List<InventoryAdjustment>();

    public virtual ICollection<InventoryTransfer> InventoryTransfers { get; set; } = new List<InventoryTransfer>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<ItemFulfilment> ItemFulfilments { get; set; } = new List<ItemFulfilment>();

    public virtual ICollection<ItemReceipt> ItemReceipts { get; set; } = new List<ItemReceipt>();

    public virtual ICollection<JournalEntry> JournalEntries { get; set; } = new List<JournalEntry>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();

    public virtual RecordType TypeOfRecordNavigation { get; set; } = null!;

    public virtual ChartOfAccount? UndepositedFundsNavigation { get; set; }

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();

    public virtual ICollection<VendorCredit> VendorCredits { get; set; } = new List<VendorCredit>();

    public virtual ICollection<VendorPayment> VendorPayments { get; set; } = new List<VendorPayment>();

    public virtual ICollection<Vendor> Vendors { get; set; } = new List<Vendor>();
}
