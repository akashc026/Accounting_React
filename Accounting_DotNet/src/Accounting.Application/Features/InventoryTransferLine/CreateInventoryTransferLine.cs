using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class CreateInventoryTransferLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public Guid InventoryTransferID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityInHand { get; set; }

        public decimal QuantityTransfer { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public string? Reason { get; set; }
    }
}

