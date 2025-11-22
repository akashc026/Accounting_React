using System;

namespace Accounting.Application.Features
{
    public class InventoryTransferLineResultDto
    {
        public Guid Id { get; set; }

        public Guid InventoryTransferID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityInHand { get; set; }

        public decimal QuantityTransfer { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? Reason { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
