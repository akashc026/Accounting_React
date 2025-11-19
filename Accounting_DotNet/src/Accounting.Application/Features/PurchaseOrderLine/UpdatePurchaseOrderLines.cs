using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdatePurchaseOrderLines : IRequest<int>
    {
        public List<PurchaseOrderLineUpdateDto> Lines { get; set; } = new();
    }

    public class PurchaseOrderLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? POID { get; set; }

        public Guid? ItemID { get; set; }

        public int? Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public int? ReceivedQty { get; set; }
    }
}
