using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class DebitMemo : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid CustomerID { get; set; }

    public Guid LocationID { get; set; }

    public DateTime TranDate { get; set; }

    public decimal TotalAmount { get; set; }

    public Guid Form { get; set; }

    public string SequenceNumber { get; set; } = null!;

    public decimal? AmountDue { get; set; }

    public decimal? AmountPaid { get; set; }

    public decimal? TaxTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? GrossAmount { get; set; }

    public Guid? Status { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<DebitMemoLine> DebitMemoLines { get; set; } = new List<DebitMemoLine>();

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location Location { get; set; } = null!;

    public virtual Status? StatusNavigation { get; set; }
}
