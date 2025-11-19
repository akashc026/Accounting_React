using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateDebitMemoLines : IRequest<int>
    {
        public List<DebitMemoLineUpdateDto> Lines { get; set; } = new();
    }

    public class DebitMemoLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? DebitMemoId { get; set; }

        public Guid? ItemID { get; set; }

        public decimal? Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }
    }
}
