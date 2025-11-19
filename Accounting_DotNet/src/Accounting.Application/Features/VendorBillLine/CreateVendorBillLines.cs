using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateVendorBillLines : IRequest<List<Guid>>
    {
        public List<VendorBillLineCreateDto> Lines { get; set; } = new();
    }

    public class VendorBillLineCreateDto
    {
        public Guid VBID { get; set; }

        public Guid ItemID { get; set; }

        public int Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public bool? IsActive { get; set; }

        public Guid? ItemReceiptLineId { get; set; }
    }
}
