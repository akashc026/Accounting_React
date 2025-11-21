using System;
using System.Collections.Generic;
using ExcentOne.Persistence.Features.Models;
using ExcentOne.Persistence.Features.Models.Auditing;

namespace Accounting.Persistence.Models;

public partial class VendorCreditPaymentLine : IEntity<System.Guid>, ICreateAudit
{
    public Guid Id { get; set; }

    public decimal PaymentAmount { get; set; }

    public string RecordID { get; set; } = null!;

    public bool? IsApplied { get; set; }

    public string? RefNo { get; set; }

    public string? RecordType { get; set; }

    public Guid? VCID { get; set; }

    public string? VendorCreditSeqNum { get; set; }

    public decimal? MainRecordAmount { get; set; }

    public DateTime CreatedDate { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual VendorCredit? VC { get; set; }
}
