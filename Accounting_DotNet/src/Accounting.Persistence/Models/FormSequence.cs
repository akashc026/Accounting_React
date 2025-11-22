using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class FormSequence : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid FormId { get; set; }

    public int FormSequenceNumber { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Form Form { get; set; } = null!;
}
