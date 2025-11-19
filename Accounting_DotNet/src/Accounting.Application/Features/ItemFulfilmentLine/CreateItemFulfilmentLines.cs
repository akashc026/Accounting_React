using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateItemFulfilmentLines : IRequest<List<Guid>>
    {
        public List<ItemFulfilmentLineCreateDto> Lines { get; set; } = new();
    }

    public class ItemFulfilmentLineCreateDto
    {
        public Guid DNID { get; set; }

        public Guid ItemID { get; set; }

        public Guid? TaxID { get; set; }

        public decimal Quantity { get; set; }

        public decimal Rate { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public int? InvoicedQty { get; set; }

        public Guid? SalesOrderLineId { get; set; }
    }
}
