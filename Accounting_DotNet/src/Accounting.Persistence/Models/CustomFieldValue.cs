using System;
using System.Collections.Generic;

namespace Accounting.Persistence.Models;

public partial class CustomFieldValue
{
    public Guid ID { get; set; }

    public Guid TypeOfRecord { get; set; }

    public string ValueText { get; set; } = null!;

    public Guid CustomFieldID { get; set; }

    public string? RecordID { get; set; }

    public virtual CustomFormField CustomField { get; set; } = null!;

    public virtual RecordType TypeOfRecordNavigation { get; set; } = null!;
}
