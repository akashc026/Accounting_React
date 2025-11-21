using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InventoryTransfer : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? CustomerID { get; set; }

    public DateTime? TranDate { get; set; }

    public Guid? FromLocation { get; set; }

    public Guid? ToLocation { get; set; }

    public bool? IsInactive { get; set; }

    public string SequenceNumber { get; set; } = null!;

    public Guid Form { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Customer? Customer { get; set; }

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location? FromLocationNavigation { get; set; }

    public virtual ICollection<InventoryTransferLine> InventoryTransferLines { get; set; } = new List<InventoryTransferLine>();

    public virtual Location? ToLocationNavigation { get; set; }
}
