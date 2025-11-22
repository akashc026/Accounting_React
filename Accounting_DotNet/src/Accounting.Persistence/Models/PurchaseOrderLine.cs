using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class PurchaseOrderLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid POID { get; set; }

    public Guid ItemID { get; set; }

    public int Quantity { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal? TaxPercent { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public int? ReceivedQty { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Product Item { get; set; } = null!;

    public virtual ICollection<ItemReceiptLine> ItemReceiptLines { get; set; } = new List<ItemReceiptLine>();

    public virtual PurchaseOrder PO { get; set; } = null!;

    public virtual Tax? Tax { get; set; }
}
