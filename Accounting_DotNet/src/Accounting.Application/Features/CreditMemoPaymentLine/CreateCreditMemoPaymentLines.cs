using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateCreditMemoPaymentLines : IRequest<List<Guid>>
    {
        public List<CreditMemoPaymentLineCreateDto> Lines { get; set; } = new();
    }

    public class CreditMemoPaymentLineCreateDto
    {
        public decimal PaymentAmount { get; set; }

        public string RecordID { get; set; } = null!;

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? CMID { get; set; }

        public string? CreditMemoSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
