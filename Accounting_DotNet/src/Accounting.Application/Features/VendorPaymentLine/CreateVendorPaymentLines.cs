using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateVendorPaymentLines : IRequest<List<Guid>>
    {

        public string? CreatedBy { get; set; }
        public List<VendorPaymentLineCreateDto> Lines { get; set; } = new();
    }

    public class VendorPaymentLineCreateDto
    {
        public decimal PaymentAmount { get; set; }

        public string RecordID { get; set; } = null!;

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? PaymentId { get; set; }

        public string? PaymentSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
