using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateInventoryDetails : IRequest<List<Guid>>
    {
        public string? CreatedBy { get; set; }

        public List<InventoryDetailCreateDto> Details { get; set; } = new();
    }

    public class InventoryDetailCreateDto
    {
        public Guid? LocationId { get; set; }

        public decimal? QuantityAvailable { get; set; }

        public Guid? ItemId { get; set; }
    }
}
