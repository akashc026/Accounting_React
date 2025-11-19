using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class ItemFulfilmentLine : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid DNID { get; set; }

    public Guid ItemID { get; set; }

    public Guid? TaxID { get; set; }

    public decimal Quantity { get; set; }

    public decimal? Rate { get; set; }

    public decimal TaxPercent { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public int? InvoicedQty { get; set; }

    public Guid? SalesOrderLineId { get; set; }

    public virtual ItemFulfilment DN { get; set; } = null!;

    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();

    public virtual Product Item { get; set; } = null!;

    public virtual SalesOrderLine? SalesOrderLine { get; set; }

    public virtual Tax? Tax { get; set; }
}
