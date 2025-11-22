using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateVendorCreditPaymentLines : IRequest<List<Guid>>
    {

        public string? CreatedBy { get; set; }
        public List<VendorCreditPaymentLineCreateDto> Lines { get; set; } = new();
    }

    public class VendorCreditPaymentLineCreateDto
    {
        public decimal PaymentAmount { get; set; }

        public string RecordID { get; set; } = null!;

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? VCID { get; set; }

        public string? VendorCreditSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
