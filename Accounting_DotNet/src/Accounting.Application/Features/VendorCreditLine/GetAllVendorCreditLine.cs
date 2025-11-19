using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllVendorCreditLine : IGetEntities<PaginatedList<VendorCreditLineResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public Guid? VCID { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}
