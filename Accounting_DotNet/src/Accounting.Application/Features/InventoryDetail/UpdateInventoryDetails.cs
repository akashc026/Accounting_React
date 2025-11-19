using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateInventoryDetails : IRequest<int>
    {
        public List<InventoryDetailUpdateDto> Details { get; set; } = new();
    }

    public class InventoryDetailUpdateDto
    {
        public Guid Id { get; set; }

        public Guid? LocationId { get; set; }

        public decimal? QuantityAvailable { get; set; }

        public Guid? ItemId { get; set; }
    }
}
