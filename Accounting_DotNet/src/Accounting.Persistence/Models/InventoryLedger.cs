using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class InventoryLedger : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid? ItemID { get; set; }

    public string? TransactionType { get; set; }

    public string? ReferenceId { get; set; }

    public decimal? QuantityChange { get; set; }

    public decimal? Rate { get; set; }

    public DateTime? Date { get; set; }

    public Guid? LocationID { get; set; }

    public virtual Product? Item { get; set; }

    public virtual Location? Location { get; set; }
}
