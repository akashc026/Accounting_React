using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class Location : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public bool? Inactive { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ICollection<CreditMemo> CreditMemos { get; set; } = new List<CreditMemo>();

    public virtual ICollection<CustomerPayment> CustomerPayments { get; set; } = new List<CustomerPayment>();

    public virtual ICollection<DebitMemo> DebitMemos { get; set; } = new List<DebitMemo>();

    public virtual ICollection<InventoryAdjustment> InventoryAdjustments { get; set; } = new List<InventoryAdjustment>();

    public virtual ICollection<InventoryDetail> InventoryDetails { get; set; } = new List<InventoryDetail>();

    public virtual ICollection<InventoryLedger> InventoryLedgers { get; set; } = new List<InventoryLedger>();

    public virtual ICollection<InventoryTransfer> InventoryTransferFromLocationNavigations { get; set; } = new List<InventoryTransfer>();

    public virtual ICollection<InventoryTransfer> InventoryTransferToLocationNavigations { get; set; } = new List<InventoryTransfer>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<ItemFulfilment> ItemFulfilments { get; set; } = new List<ItemFulfilment>();

    public virtual ICollection<ItemReceipt> ItemReceipts { get; set; } = new List<ItemReceipt>();

    public virtual ICollection<ProductStock> ProductStocks { get; set; } = new List<ProductStock>();

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();

    public virtual ICollection<VendorCredit> VendorCredits { get; set; } = new List<VendorCredit>();

    public virtual ICollection<VendorPayment> VendorPayments { get; set; } = new List<VendorPayment>();
}
