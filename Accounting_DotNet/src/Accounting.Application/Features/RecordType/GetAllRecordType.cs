using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;

namespace Accounting.Application.Features
{
    public class GetAllRecordType : IGetEntities<List<RecordTypeResultDto>>
    {
        public string? SearchText { get; set; }
    }
}