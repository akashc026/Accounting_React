using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InventoryTransferLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid ItemID { get; set; }

    public decimal QuantityInHand { get; set; }

    public decimal QuantityTransfer { get; set; }

    public decimal? Rate { get; set; }

    public decimal? TotalAmount { get; set; }

    public Guid InventoryTransferID { get; set; }

    public string? Reason { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual InventoryTransfer InventoryTransfer { get; set; } = null!;

    public virtual Product Item { get; set; } = null!;
}
