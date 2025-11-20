using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class Invoice : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid CustomerID { get; set; }

    public Guid LocationID { get; set; }

    public DateTime InvoiceDate { get; set; }

    public decimal TotalAmount { get; set; }

    public Guid? DNID { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public bool? Inactive { get; set; }

    public decimal? Discount { get; set; }

    public decimal? AmountDue { get; set; }

    public decimal? AmountPaid { get; set; }

    public Guid? Status { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? TaxTotal { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ItemFulfilment? DN { get; set; }

    public virtual Form? FormNavigation { get; set; }

    public virtual ICollection<InvoiceFulFillMentLink> InvoiceFulFillMentLinks { get; set; } = new List<InvoiceFulFillMentLink>();

    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();

    public virtual Location Location { get; set; } = null!;

    public virtual Status? StatusNavigation { get; set; }
}
