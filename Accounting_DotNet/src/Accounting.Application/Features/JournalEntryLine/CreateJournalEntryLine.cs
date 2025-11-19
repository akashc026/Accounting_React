using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateJournalEntryLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public decimal? Debit { get; set; }

        public decimal? Credit { get; set; }

        public string? RecordID { get; set; }

        public string? Memo { get; set; }

        public string? RecordType { get; set; }

        public Guid? Account { get; set; }

        public Guid? JEID { get; set; }
    }
}
