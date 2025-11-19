using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateItemReceiptLines : IRequest<int>
    {
        public List<ItemReceiptLineUpdateDto> Lines { get; set; } = new();
    }

    public class ItemReceiptLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? IRID { get; set; }

        public Guid? ItemID { get; set; }

        public int? Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid? PurchaseOrderLineId { get; set; }

        public int? InvoicedQty { get; set; }
    }
}
