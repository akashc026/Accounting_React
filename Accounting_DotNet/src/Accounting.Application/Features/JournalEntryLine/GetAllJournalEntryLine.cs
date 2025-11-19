using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetAllJournalEntryLine : IGetEntities<PaginatedList<JournalEntryLineResultDto>>, IPageCollection
    {
        public string? SearchText { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string? RecordID { get; set; } // Filter by RecordID
    }
}
