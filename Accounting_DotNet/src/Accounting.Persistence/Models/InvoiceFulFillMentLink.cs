using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class InvoiceFulFillMentLink : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid InvoiceID { get; set; }

    public Guid ItemFulFillmentID { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual ItemFulfilment ItemFulFillment { get; set; } = null!;
}
