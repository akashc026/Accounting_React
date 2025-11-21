using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class VendorBillLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid VBID { get; set; }

    public Guid ItemID { get; set; }

    public int Quantity { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal? TaxPercent { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public bool? IsActive { get; set; }

    public Guid? ItemReceiptLineId { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;

    public virtual ItemReceiptLine? ItemReceiptLine { get; set; }

    public virtual Tax? Tax { get; set; }

    public virtual VendorBill VB { get; set; } = null!;
}
