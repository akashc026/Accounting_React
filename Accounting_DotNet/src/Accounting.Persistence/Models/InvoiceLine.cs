using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InvoiceLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid ItemID { get; set; }

    public decimal QuantityDelivered { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal TaxPercent { get; set; }

    public decimal TaxRate { get; set; }

    public decimal TotalAmount { get; set; }

    public Guid INID { get; set; }

    public Guid? ItemFulfillmentLineId { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Invoice IN { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;

    public virtual ItemFulfilmentLine? ItemFulfillmentLine { get; set; }

    public virtual Tax? Tax { get; set; }
}
