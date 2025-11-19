using ExcentOne.Application.Features.Queries;
using System;

namespace Accounting.Application.Features
{
    public class GetInventoryAdjustment : IGetEntity<Guid, InventoryAdjustmentResultDto>
    {
        public Guid Id { get; set; }
    }
}

