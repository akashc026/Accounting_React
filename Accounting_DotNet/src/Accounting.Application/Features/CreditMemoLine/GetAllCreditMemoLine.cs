using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllCreditMemoLine : IGetEntities<PaginatedList<CreditMemoLineResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public Guid? CMID { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}
