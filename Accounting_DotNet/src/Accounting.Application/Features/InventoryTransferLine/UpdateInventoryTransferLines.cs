using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateInventoryTransferLines : IRequest<int>
    {
        public List<InventoryTransferLineUpdateDto> Lines { get; set; } = new();
    }

    public class InventoryTransferLineUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? ItemID { get; set; }

        public decimal? QuantityInHand { get; set; }

        public decimal? QuantityTransfer { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid? InventoryTransferID { get; set; }

        public string? Reason { get; set; }
    }
}
