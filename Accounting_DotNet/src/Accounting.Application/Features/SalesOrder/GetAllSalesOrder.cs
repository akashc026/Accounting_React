using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllSalesOrder : IGetEntities<PaginatedList<SalesOrderResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public Guid? LocationID { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
} 