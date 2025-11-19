using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class AccountType : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public string? Name { get; set; }

    public virtual ICollection<ChartOfAccount> ChartOfAccounts { get; set; } = new List<ChartOfAccount>();
}
