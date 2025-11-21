using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class SalesOrderNumberSequence : IEntity<System.Int32>, ICreateAudit
{
    public int Id { get; set; }

    public int LastNumber { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;
}
