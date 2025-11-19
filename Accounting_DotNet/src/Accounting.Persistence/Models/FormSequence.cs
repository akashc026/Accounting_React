using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class FormSequence : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid FormId { get; set; }

    public int FormSequenceNumber { get; set; }

    public virtual Form Form { get; set; } = null!;
}
