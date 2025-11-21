using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class ProductStock : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? ItemID { get; set; }

    public Guid? LocationID { get; set; }

    public decimal Quantity { get; set; }

    public decimal OpeningStockQty { get; set; }

    public decimal OpeningStockRate { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Product? Item { get; set; }

    public virtual Location? Location { get; set; }
}
