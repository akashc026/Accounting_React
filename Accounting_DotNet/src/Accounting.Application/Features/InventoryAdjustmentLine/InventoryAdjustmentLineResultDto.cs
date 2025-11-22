using System;

namespace Accounting.Application.Features
{
    public class InventoryAdjustmentLineResultDto
    {
        public Guid Id { get; set; }

        public Guid InventoryAdjustmentID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityInHand { get; set; }

        public decimal QuantityAdjusted { get; set; }


        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? Reason { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
