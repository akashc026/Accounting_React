using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class VendorPayment : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? Location { get; set; }

    public Guid Vendor { get; set; }

    public Guid Form { get; set; }

    public decimal? Amount { get; set; }

    public decimal? AppliedAmount { get; set; }

    public decimal? UnAppliedAmount { get; set; }

    public string SequenceNumber { get; set; } = null!;

    public DateTime? PaymentDate { get; set; }

    public Guid? Status { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location? LocationNavigation { get; set; }

    public virtual Status? StatusNavigation { get; set; }

    public virtual Vendor VendorNavigation { get; set; } = null!;

    public virtual ICollection<VendorPaymentLine> VendorPaymentLines { get; set; } = new List<VendorPaymentLine>();
}
