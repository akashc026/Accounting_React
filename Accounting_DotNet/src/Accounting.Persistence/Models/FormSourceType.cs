using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class FormSourceType : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public virtual ICollection<Form> Forms { get; set; } = new List<Form>();
}
