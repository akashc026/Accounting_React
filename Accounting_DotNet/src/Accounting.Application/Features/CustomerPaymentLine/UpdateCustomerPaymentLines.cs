using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateCustomerPaymentLines : IRequest<int>
    {
        public List<CustomerPaymentLineUpdateDto> Lines { get; set; } = new();
    }

    public class CustomerPaymentLineUpdateDto
    {
        public Guid Id { get; set; }

        public decimal? PaymentAmount { get; set; }

        public string? RecordID { get; set; }

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? PaymentId { get; set; }

        public string? PaymentSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
