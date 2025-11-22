using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class CustomFieldValue : ICreateAudit
{
    public Guid ID { get; set; }

    public Guid TypeOfRecord { get; set; }

    public string ValueText { get; set; } = null!;

    public Guid CustomFieldID { get; set; }

    public string? RecordID { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual CustomFormField CustomField { get; set; } = null!;

    public virtual RecordType TypeOfRecordNavigation { get; set; } = null!;
}
