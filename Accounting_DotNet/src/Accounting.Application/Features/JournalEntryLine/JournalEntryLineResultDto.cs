using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class JournalEntryLineResultDto
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
