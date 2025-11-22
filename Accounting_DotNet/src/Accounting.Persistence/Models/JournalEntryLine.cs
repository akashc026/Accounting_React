using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class JournalEntryLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public decimal? Debit { get; set; }

    public decimal? Credit { get; set; }

    public string? RecordID { get; set; }

    public string? Memo { get; set; }

    public string? RecordType { get; set; }

    public Guid? Account { get; set; }

    public Guid? JEID { get; set; }

    public int? Display { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual ChartOfAccount? AccountNavigation { get; set; }

    public virtual JournalEntry? JE { get; set; }
}
