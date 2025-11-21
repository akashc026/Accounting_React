using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class VendorCredit : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid Form { get; set; }

    public Guid VendorID { get; set; }

    public Guid LocationID { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? Applied { get; set; }

    public decimal? UnApplied { get; set; }

    public string? SequenceNumber { get; set; }

    public DateTime? TranDate { get; set; }

    public Guid? Status { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? TaxTotal { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location Location { get; set; } = null!;

    public virtual Status? StatusNavigation { get; set; }

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual ICollection<VendorCreditLine> VendorCreditLines { get; set; } = new List<VendorCreditLine>();

    public virtual ICollection<VendorCreditPaymentLine> VendorCreditPaymentLines { get; set; } = new List<VendorCreditPaymentLine>();
}
