using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateCreditMemoPaymentLines : IRequest<int>
    {
        public List<CreditMemoPaymentLineUpdateDto> Lines { get; set; } = new();
    }

    public class CreditMemoPaymentLineUpdateDto
    {
        public Guid Id { get; set; }

        public decimal? PaymentAmount { get; set; }

        public string? RecordID { get; set; }

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? CMID { get; set; }

        public string? CreditMemoSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
