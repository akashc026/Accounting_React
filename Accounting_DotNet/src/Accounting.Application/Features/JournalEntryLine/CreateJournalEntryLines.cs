using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class CreateJournalEntryLines : IRequest<List<Guid>>
    {
        public List<JournalEntryLineCreateDto> Lines { get; set; } = new();
    }

    public class JournalEntryLineCreateDto
    {
        public decimal? Debit { get; set; }

        public decimal? Credit { get; set; }

        public string? RecordID { get; set; }

        public string? Memo { get; set; }

        public string? RecordType { get; set; }

        public Guid? Account { get; set; }

        public Guid? JEID { get; set; }
    }
}
