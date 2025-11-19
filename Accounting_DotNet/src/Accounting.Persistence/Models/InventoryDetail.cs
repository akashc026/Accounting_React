using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class InventoryDetail : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid? LocationId { get; set; }

    public decimal? QuantityAvailable { get; set; }

    public Guid? ItemId { get; set; }

    public virtual Product? Item { get; set; }

    public virtual Location? Location { get; set; }
}
