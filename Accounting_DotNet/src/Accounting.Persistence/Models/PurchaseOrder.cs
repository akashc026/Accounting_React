using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class PurchaseOrder : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid VendorID { get; set; }

    public DateTime? PODate { get; set; }

    public Guid? Status { get; set; }

    public Guid? LocationID { get; set; }

    public decimal? TotalAmount { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public bool? Inactive { get; set; }

    public decimal? Discount { get; set; }

    public decimal? TaxTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? GrossAmount { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Form? FormNavigation { get; set; }

    public virtual ICollection<ItemReceipt> ItemReceipts { get; set; } = new List<ItemReceipt>();

    public virtual Location? Location { get; set; }

    public virtual ICollection<PurchaseOrderLine> PurchaseOrderLines { get; set; } = new List<PurchaseOrderLine>();

    public virtual Status? StatusNavigation { get; set; }

    public virtual Vendor Vendor { get; set; } = null!;
}
