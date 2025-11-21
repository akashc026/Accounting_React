using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InventoryLedger : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid? ItemID { get; set; }

    public string? TransactionType { get; set; }

    public string? ReferenceId { get; set; }

    public decimal? QuantityChange { get; set; }

    public decimal? Rate { get; set; }

    public DateTime? Date { get; set; }

    public Guid? LocationID { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Product? Item { get; set; }

    public virtual Location? Location { get; set; }
}
