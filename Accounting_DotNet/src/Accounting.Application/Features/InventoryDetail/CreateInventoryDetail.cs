using ExcentOne.Application.Features.Commands;
using System;

namespace Accounting.Application.Features
{
    public class CreateInventoryDetail : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public Guid? LocationId { get; set; }

        public decimal? QuantityAvailable { get; set; }

        public Guid? ItemId { get; set; }
    }
}
