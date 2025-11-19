using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllSalesOrderLine : IGetEntities<PaginatedList<SalesOrderLineResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
} 