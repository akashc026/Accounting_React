using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetJournalEntryLinesByJournalEntryId : IGetEntities<IEnumerable<JournalEntryLineResultDto>>
    {
        public Guid JournalEntryId { get; set; }
    }
}
