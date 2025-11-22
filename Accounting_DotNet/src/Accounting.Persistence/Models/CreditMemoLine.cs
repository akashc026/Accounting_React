using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class CreditMemoLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid CMID { get; set; }

    public Guid ItemID { get; set; }

    public decimal Quantity { get; set; }

    public decimal? Rate { get; set; }

    public Guid? TaxID { get; set; }

    public decimal? TaxPercent { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual CreditMemo CM { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;

    public virtual Tax? Tax { get; set; }
}
