using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using System;

namespace Accounting.Application.Features
{
    public class GetAllInventoryDetail : IGetEntities<PaginatedList<InventoryDetailResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public Guid? ItemId { get; set; }
        public Guid? LocationId { get; set; }
    }
}
