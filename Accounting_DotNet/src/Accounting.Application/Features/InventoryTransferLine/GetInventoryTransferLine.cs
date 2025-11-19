using ExcentOne.Application.Features.Queries;
using System;

namespace Accounting.Application.Features
{
    public class GetInventoryTransferLine : IGetEntity<Guid, InventoryTransferLineResultDto>
    {
        public Guid Id { get; set; }
    }
}

