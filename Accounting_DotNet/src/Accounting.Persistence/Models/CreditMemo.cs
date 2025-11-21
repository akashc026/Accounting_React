using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class CreditMemo : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public Guid Form { get; set; }

    public Guid CustomerID { get; set; }

    public Guid LocationID { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? Applied { get; set; }

    public decimal? UnApplied { get; set; }

    public string? SequenceNumber { get; set; }

    public DateTime? TranDate { get; set; }

    public Guid? Status { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal? NetTotal { get; set; }

    public decimal? SubTotal { get; set; }

    public decimal? TaxTotal { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ICollection<CreditMemoLine> CreditMemoLines { get; set; } = new List<CreditMemoLine>();

    public virtual ICollection<CreditMemoPaymentLine> CreditMemoPaymentLines { get; set; } = new List<CreditMemoPaymentLine>();

    public virtual Customer Customer { get; set; } = null!;

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location Location { get; set; } = null!;

    public virtual Status? StatusNavigation { get; set; }
}
