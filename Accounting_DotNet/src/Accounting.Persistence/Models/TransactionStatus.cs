using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class TransactionStatus : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public Guid TypeOfRecord { get; set; }

    public virtual RecordType TypeOfRecordNavigation { get; set; } = null!;
}
