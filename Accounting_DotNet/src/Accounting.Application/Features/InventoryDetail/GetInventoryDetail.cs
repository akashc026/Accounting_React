using ExcentOne.Application.Features.Queries;
using System;

namespace Accounting.Application.Features
{
    public class GetInventoryDetail : IGetEntity<Guid, InventoryDetailResultDto>
    {
        public Guid Id { get; set; }
    }
}
