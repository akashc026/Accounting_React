using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class StandardField : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public Guid TypeOfRecord { get; set; }

    public Guid FieldType { get; set; }

    public bool IsMandatory { get; set; }

    public bool IsDisabled { get; set; }

    public string Source { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public string? Label { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual TypeOfField FieldTypeNavigation { get; set; } = null!;

    public virtual RecordType TypeOfRecordNavigation { get; set; } = null!;
}
