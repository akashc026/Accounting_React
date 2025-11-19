using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class JournalEntry : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public decimal? JournalAmount { get; set; }

    public Guid Form { get; set; }

    public string? SequenceNumber { get; set; }

    public DateTime TranDate { get; set; }

    public string? Memo { get; set; }

    public string? RecordID { get; set; }

    public string? RecordType { get; set; }

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual ICollection<JournalEntryLine> JournalEntryLines { get; set; } = new List<JournalEntryLine>();
}
