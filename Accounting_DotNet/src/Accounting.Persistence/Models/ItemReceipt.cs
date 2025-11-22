using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class ItemReceipt : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid VendorID { get; set; }

    public Guid? POID { get; set; }

    public DateTime? ReceiptDate { get; set; }

    public Guid? Status { get; set; }

    public Guid LocationID { get; set; }

    public decimal? TotalAmount { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public bool? Inactive { get; set; }

    public decimal? Discount { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? TaxTotal { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Form? FormNavigation { get; set; }

    public virtual ICollection<ItemReceiptLine> ItemReceiptLines { get; set; } = new List<ItemReceiptLine>();

    public virtual Location Location { get; set; } = null!;

    public virtual PurchaseOrder? PO { get; set; }

    public virtual Status? StatusNavigation { get; set; }

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();
}
