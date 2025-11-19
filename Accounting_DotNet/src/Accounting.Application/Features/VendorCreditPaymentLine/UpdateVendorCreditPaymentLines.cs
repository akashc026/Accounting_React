using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditPaymentLines : IRequest<int>
    {
        public List<VendorCreditPaymentLineUpdateDto> Lines { get; set; } = new();
    }

    public class VendorCreditPaymentLineUpdateDto
    {
        public Guid Id { get; set; }

        public decimal? PaymentAmount { get; set; }

        public string? RecordID { get; set; }

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? VCID { get; set; }

        public string? VendorCreditSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
