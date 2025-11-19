using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class ItemReceiptLine : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid IRID { get; set; }

    public Guid ItemID { get; set; }

    public int Quantity { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal? TaxPercent { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public Guid? PurchaseOrderLineId { get; set; }

    public int? InvoicedQty { get; set; }

    public virtual ItemReceipt IR { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;

    public virtual PurchaseOrderLine? PurchaseOrderLine { get; set; }

    public virtual Tax? Tax { get; set; }

    public virtual ICollection<VendorBillLine> VendorBillLines { get; set; } = new List<VendorBillLine>();
}
