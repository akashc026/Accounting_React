using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class CustomerPayment : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public Guid? Location { get; set; }

    public Guid Customer { get; set; }

    public Guid Form { get; set; }

    public decimal? Amount { get; set; }

    public decimal? AppliedAmount { get; set; }

    public decimal? UnAppliedAmount { get; set; }

    public string SequenceNumber { get; set; } = null!;

    public DateTime? PaymentDate { get; set; }

    public Guid? Status { get; set; }

    public virtual Customer CustomerNavigation { get; set; } = null!;

    public virtual ICollection<CustomerPaymentLine> CustomerPaymentLines { get; set; } = new List<CustomerPaymentLine>();

    public virtual Form FormNavigation { get; set; } = null!;

    public virtual Location? LocationNavigation { get; set; }

    public virtual Status? StatusNavigation { get; set; }
}
