using ExcentOne.Application.Features.Queries;
using System;

namespace Accounting.Application.Features
{
    public class GetInventoryAdjustmentLine : IGetEntity<Guid, InventoryAdjustmentLineResultDto>
    {
        public Guid Id { get; set; }
    }
}

