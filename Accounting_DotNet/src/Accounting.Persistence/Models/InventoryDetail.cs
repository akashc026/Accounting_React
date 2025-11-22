using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InventoryDetail : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? LocationId { get; set; }

    public decimal? QuantityAvailable { get; set; }

    public Guid? ItemId { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Product? Item { get; set; }

    public virtual Location? Location { get; set; }
}
