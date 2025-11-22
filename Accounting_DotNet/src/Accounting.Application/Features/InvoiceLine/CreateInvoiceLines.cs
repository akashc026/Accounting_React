using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateInvoiceLines : IRequest<List<Guid>>
    {

        public string? CreatedBy { get; set; }
        public List<InvoiceLineCreateDto> Lines { get; set; } = new();
    }

    public class InvoiceLineCreateDto
    {
        public Guid INID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityDelivered { get; set; }

        public decimal Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxRate { get; set; }

        public decimal TotalAmount { get; set; }

        public Guid? ItemFulfillmentLineId { get; set; }
    }
}
