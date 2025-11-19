using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateSalesOrderLines : IRequest<int>
    {
        public List<SalesOrderLineUpdateDto> Lines { get; set; } = new();
    }

    public class SalesOrderLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? SOID { get; set; }

        public Guid? ItemID { get; set; }

        public decimal? Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public int? FulFillQty { get; set; }
    }
}
