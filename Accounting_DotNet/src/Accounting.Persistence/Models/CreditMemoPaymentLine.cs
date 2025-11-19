using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;

namespace Accounting.Persistence.Models;

public partial class CreditMemoPaymentLine : IEntity<System.Guid>
{
    public Guid Id { get; set; }

    public decimal PaymentAmount { get; set; }

    public string RecordID { get; set; } = null!;

    public bool? IsApplied { get; set; }

    public string? RefNo { get; set; }

    public string? RecordType { get; set; }

    public Guid? CMID { get; set; }

    public string? CreditMemoSeqNum { get; set; }

    public decimal? MainRecordAmount { get; set; }

    public virtual CreditMemo? CM { get; set; }
}
