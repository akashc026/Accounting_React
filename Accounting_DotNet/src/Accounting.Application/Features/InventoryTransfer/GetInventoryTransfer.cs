using ExcentOne.Application.Features.Queries;
using System;

namespace Accounting.Application.Features
{
    public class GetInventoryTransfer : IGetEntity<Guid, InventoryTransferResultDto>
    {
        public Guid Id { get; set; }
    }
}

