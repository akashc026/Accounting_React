using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class TypeOfField : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string ComponentName { get; set; } = null!;

    public string PackageName { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ICollection<CustomFormField> CustomFormFields { get; set; } = new List<CustomFormField>();

    public virtual ICollection<StandardField> StandardFields { get; set; } = new List<StandardField>();
}
