using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class ItemFulfilment : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid? SOID { get; set; }

    public DateTime DeliveryDate { get; set; }

    public Guid CustomerID { get; set; }

    public Guid LocationID { get; set; }

    public Guid? Form { get; set; }

    public string? SequenceNumber { get; set; }

    public bool? Inactive { get; set; }

    public decimal? Discount { get; set; }

    public Guid? Status { get; set; }

    public int? InvoicedQty { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? TaxTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? GrossAmount { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual Form? FormNavigation { get; set; }

    public virtual ICollection<InvoiceFulFillMentLink> InvoiceFulFillMentLinks { get; set; } = new List<InvoiceFulFillMentLink>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<ItemFulfilmentLine> ItemFulfilmentLines { get; set; } = new List<ItemFulfilmentLine>();

    public virtual Location Location { get; set; } = null!;

    public virtual SalesOrder? SO { get; set; }

    public virtual Status? StatusNavigation { get; set; }
}
