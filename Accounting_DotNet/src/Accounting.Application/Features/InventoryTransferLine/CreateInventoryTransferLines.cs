using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateInventoryTransferLines : IRequest<List<Guid>>
    {

        public string? CreatedBy { get; set; }
        public List<InventoryTransferLineCreateDto> Lines { get; set; } = new();
    }

    public class InventoryTransferLineCreateDto
    {
        public Guid ItemID { get; set; }

        public decimal QuantityInHand { get; set; }

        public decimal QuantityTransfer { get; set; }

        public decimal? Rate { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid InventoryTransferID { get; set; }

        public string? Reason { get; set; }
    }
}
