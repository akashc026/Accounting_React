using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class FormSourceType : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ICollection<Form> Forms { get; set; } = new List<Form>();
}
