using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateInventoryAdjustmentLines : IRequest<int>
    {
        public List<InventoryAdjustmentLineUpdateDto> Lines { get; set; } = new();
    }

    public class InventoryAdjustmentLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? InventoryAdjustmentID { get; set; }

        public Guid? ItemID { get; set; }

        public decimal? QuantityInHand { get; set; }

        public decimal? QuantityAdjusted { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? Reason { get; set; }
    }
}
