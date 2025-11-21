using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class RecordType : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ICollection<CustomFieldValue> CustomFieldValues { get; set; } = new List<CustomFieldValue>();

    public virtual ICollection<Form> Forms { get; set; } = new List<Form>();

    public virtual ICollection<StandardField> StandardFields { get; set; } = new List<StandardField>();

    public virtual ICollection<TransactionStatus> TransactionStatuses { get; set; } = new List<TransactionStatus>();
}
