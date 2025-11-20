using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class InvoiceFulFillMentLink : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid InvoiceID { get; set; }

    public Guid ItemFulFillmentID { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual ItemFulfilment ItemFulFillment { get; set; } = null!;
}
