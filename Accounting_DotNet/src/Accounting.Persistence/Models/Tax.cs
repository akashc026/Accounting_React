using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class Tax : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal TaxRate { get; set; }

    public Guid? TaxAccount { get; set; }

    public bool? Inactive { get; set; }

    public virtual ICollection<CreditMemoLine> CreditMemoLines { get; set; } = new List<CreditMemoLine>();

    public virtual ICollection<DebitMemoLine> DebitMemoLines { get; set; } = new List<DebitMemoLine>();

    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();

    public virtual ICollection<ItemFulfilmentLine> ItemFulfilmentLines { get; set; } = new List<ItemFulfilmentLine>();

    public virtual ICollection<ItemReceiptLine> ItemReceiptLines { get; set; } = new List<ItemReceiptLine>();

    public virtual ICollection<Product> ProductPurchaseTaxCodeNavigations { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductSalesTaxCodeNavigations { get; set; } = new List<Product>();

    public virtual ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = new List<PurchaseOrderLine>();

    public virtual ICollection<SalesOrderLine> SalesOrderLines { get; set; } = new List<SalesOrderLine>();

    public virtual ChartOfAccount? TaxAccountNavigation { get; set; }

    public virtual ICollection<VendorBillLine> VendorBillLines { get; set; } = new List<VendorBillLine>();

    public virtual ICollection<VendorCreditLine> VendorCreditLines { get; set; } = new List<VendorCreditLine>();
}
