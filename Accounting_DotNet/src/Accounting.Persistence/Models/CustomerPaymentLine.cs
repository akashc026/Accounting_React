using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class CustomerPaymentLine : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public decimal PaymentAmount { get; set; }

    public string RecordID { get; set; } = null!;

    public bool? IsApplied { get; set; }

    public string? RefNo { get; set; }

    public string? RecordType { get; set; }

    public Guid? PaymentId { get; set; }

    public string? PaymentSeqNum { get; set; }

    public decimal? MainRecordAmount { get; set; }

    public virtual CustomerPayment? Payment { get; set; }
}
