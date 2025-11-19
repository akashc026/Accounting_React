using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetUnreceivedPurchaseOrderLines : IGetEntities<PaginatedList<PurchaseOrderLineResultDto>>, IPageCollection
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchText { get; set; }
        public Guid? POID { get; set; }
    }
}
