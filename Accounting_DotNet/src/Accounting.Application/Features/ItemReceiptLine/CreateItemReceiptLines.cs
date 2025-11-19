using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateItemReceiptLines : IRequest<List<Guid>>
    {
        public List<ItemReceiptLineCreateDto> Lines { get; set; } = new();
    }

    public class ItemReceiptLineCreateDto
    {
        public Guid IRID { get; set; }

        public Guid ItemID { get; set; }

        public int Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid? PurchaseOrderLineId { get; set; }

        public int? InvoicedQty { get; set; }
    }
}
