using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class DebitMemoLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid DebitMemoId { get; set; }

    public Guid ItemID { get; set; }

    public decimal Quantity { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal? TaxPercent { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual DebitMemo DebitMemo { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;

    public virtual Tax? Tax { get; set; }
}
