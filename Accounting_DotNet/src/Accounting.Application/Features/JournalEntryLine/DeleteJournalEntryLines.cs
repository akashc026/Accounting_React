using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class DeleteJournalEntryLines : IRequest<int>
    {
        public List<Guid> Ids { get; set; } = new();
    }
}
