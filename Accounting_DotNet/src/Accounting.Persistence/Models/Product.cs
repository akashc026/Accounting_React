using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class Product : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string ItemCode { get; set; } = null!;

    public string ItemName { get; set; } = null!;

    public Guid? InventoryAccount { get; set; }

    public Guid? COGSAccount { get; set; }

    public Guid? SalesAccount { get; set; }

    public Guid? ExpenseAccount { get; set; }

    public Guid? ItemType { get; set; }

    public decimal? SalesPrice { get; set; }

    public decimal? PurchasePrice { get; set; }

    public decimal? StandardCost { get; set; }

    public Guid? SalesTaxCode { get; set; }

    public bool? Inactive { get; set; }

    public decimal? AverageCost { get; set; }

    public Guid? PurchaseTaxCode { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ChartOfAccount? COGSAccountNavigation { get; set; }

    public virtual ICollection<CreditMemoLine> CreditMemoLines { get; set; } = new List<CreditMemoLine>();

    public virtual ICollection<DebitMemoLine> DebitMemoLines { get; set; } = new List<DebitMemoLine>();

    public virtual ChartOfAccount? ExpenseAccountNavigation { get; set; }

    public virtual Form? FormNavigation { get; set; }

    public virtual ChartOfAccount? InventoryAccountNavigation { get; set; }

    public virtual ICollection<InventoryAdjustmentLine> InventoryAdjustmentLines { get; set; } = new List<InventoryAdjustmentLine>();

    public virtual ICollection<InventoryDetail> InventoryDetails { get; set; } = new List<InventoryDetail>();

    public virtual ICollection<InventoryLedger> InventoryLedgers { get; set; } = new List<InventoryLedger>();

    public virtual ICollection<InventoryTransferLine> InventoryTransferLines { get; set; } = new List<InventoryTransferLine>();

    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();

    public virtual ICollection<ItemFulfilmentLine> ItemFulfilmentLines { get; set; } = new List<ItemFulfilmentLine>();

    public virtual ICollection<ItemReceiptLine> ItemReceiptLines { get; set; } = new List<ItemReceiptLine>();

    public virtual ItemType? ItemTypeNavigation { get; set; }

    public virtual ICollection<ProductStock> ProductStocks { get; set; } = new List<ProductStock>();

    public virtual ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = new List<PurchaseOrderLine>();

    public virtual Tax? PurchaseTaxCodeNavigation { get; set; }

    public virtual ChartOfAccount? SalesAccountNavigation { get; set; }

    public virtual ICollection<SalesOrderLine> SalesOrderLines { get; set; } = new List<SalesOrderLine>();

    public virtual Tax? SalesTaxCodeNavigation { get; set; }

    public virtual ICollection<VendorBillLine> VendorBillLines { get; set; } = new List<VendorBillLine>();

    public virtual ICollection<VendorCreditLine> VendorCreditLines { get; set; } = new List<VendorCreditLine>();
}
