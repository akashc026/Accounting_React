using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditLines : IRequest<int>
    {
        public List<VendorCreditLineUpdateDto> Lines { get; set; } = new();
    }

    public class VendorCreditLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? VCID { get; set; }

        public Guid? ItemID { get; set; }

        public decimal? Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxId { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }
    }
}
