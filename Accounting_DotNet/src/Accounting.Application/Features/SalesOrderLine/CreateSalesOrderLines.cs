using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateSalesOrderLines : IRequest<List<Guid>>
    {
        public List<SalesOrderLineCreateDto> Lines { get; set; } = new();
    }

    public class SalesOrderLineCreateDto
    {
        public Guid SOID { get; set; }

        public Guid ItemID { get; set; }

        public decimal Quantity { get; set; }

        public decimal Rate { get; set; }

        public Guid TaxID { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public int? FulFillQty { get; set; }
    }
}
