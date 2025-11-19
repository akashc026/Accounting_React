using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class SalesOrderNumberSequence : IEntity<System.Int32>
{
    public int Id { get; set; }

    public int LastNumber { get; set; }
}
