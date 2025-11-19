using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using MediatR;

namespace Accounting.Application.Features
{
    public class GetProductsByItemType : IRequest<IEnumerable<ProductResultDto>>, ISortCollection
    {
        public Guid ItemTypeId { get; set; }
        public string? SearchText { get; set; }
        
        public IEnumerable<SortParameter> Sorting { get; set; } = new List<SortParameter>();
    }
}
