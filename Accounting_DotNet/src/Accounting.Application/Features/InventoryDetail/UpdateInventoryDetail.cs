using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class UpdateInventoryDetail : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid? LocationId { get; set; }

        public decimal? QuantityAvailable { get; set; }

        public Guid? ItemId { get; set; }
    }
}
