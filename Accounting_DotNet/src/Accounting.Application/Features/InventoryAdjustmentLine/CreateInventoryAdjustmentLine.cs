using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class CreateInventoryAdjustmentLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public Guid InventoryAdjustmentID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityInHand { get; set; }

        public decimal QuantityAdjusted { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? Reason { get; set; }

        public string? CreatedBy { get; set; }
    }
}
