using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllProduct : IGetEntities<List<ProductResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public string? SortBy { get; set; }
        public string? SortOrder { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public Guid? ItemType { get; set; }
        public bool? Inactive { get; set; }
    }
}
