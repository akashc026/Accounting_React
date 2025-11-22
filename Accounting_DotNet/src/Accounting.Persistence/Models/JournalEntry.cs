using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class JournalEntry : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public decimal? JournalAmount { get; set; }

    public Guid Form { get; set; }

    public string? SequenceNumber { get; set; }

    public DateTime TranDate { get; set; }

    public string? Memo { get; set; }

    public string? RecordID { get; set; }

    public string? RecordType { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual ICollection<JournalEntryLine> JournalEntryLines { get; set; } = new List<JournalEntryLine>();
}
