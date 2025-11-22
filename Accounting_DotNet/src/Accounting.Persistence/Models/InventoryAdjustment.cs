using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InventoryAdjustment : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? Customer { get; set; }

    public DateTime? TranDate { get; set; }

    public Guid? Location { get; set; }

    public bool? IsInactive { get; set; }

    public string SequenceNumber { get; set; } = null!;

    public Guid Form { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Customer? CustomerNavigation { get; set; }

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual ICollection<InventoryAdjustmentLine> InventoryAdjustmentLines { get; set; } = new List<InventoryAdjustmentLine>();

    public virtual Location? LocationNavigation { get; set; }
}
