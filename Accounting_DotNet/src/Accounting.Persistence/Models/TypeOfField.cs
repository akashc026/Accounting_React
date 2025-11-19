using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class TypeOfField : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string ComponentName { get; set; } = null!;

    public string PackageName { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<CustomFormField> CustomFormFields { get; set; } = new List<CustomFormField>();

    public virtual ICollection<StandardField> StandardFields { get; set; } = new List<StandardField>();
}
