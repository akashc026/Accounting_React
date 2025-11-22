using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreatePurchaseOrderLines : IRequest<List<Guid>>
    {

        public string? CreatedBy { get; set; }
        public List<PurchaseOrderLineCreateDto> Lines { get; set; } = new();
    }

    public class PurchaseOrderLineCreateDto
    {
        public Guid POID { get; set; }

        public Guid ItemID { get; set; }

        public int Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public int? ReceivedQty { get; set; }
    }
}
