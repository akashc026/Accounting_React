using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class JournalEntryResultDto
    {
        public Guid Id { get; set; }

        public decimal? JournalAmount { get; set; }

        public Guid Form { get; set; }

        public string? FormName { get; set; }

        public string? SequenceNumber { get; set; }

        public DateTime TranDate { get; set; }

        public string? Memo { get; set; }

        public string? RecordID { get; set; }

        public string? RecordType { get; set; }

        public List<JournalEntryLineDto>? JournalEntryLines { get; set; }
    }

    public class JournalEntryLineDto
    {
        public Guid Id { get; set; }

        public decimal? Debit { get; set; }

        public decimal? Credit { get; set; }

        public string? RecordID { get; set; }

        public string? Memo { get; set; }

        public string? RecordType { get; set; }

        public Guid? Account { get; set; }

        public string? AccountName { get; set; }

        public Guid? JEID { get; set; }
    }
}
