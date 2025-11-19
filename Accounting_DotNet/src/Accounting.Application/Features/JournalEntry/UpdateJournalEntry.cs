using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateJournalEntry : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public decimal? JournalAmount { get; set; }

        public Guid? Form { get; set; }

        public string? SequenceNumber { get; set; }

        public DateTime? TranDate { get; set; }

        public string? Memo { get; set; }

        public string? RecordID { get; set; }

        public string? RecordType { get; set; }
    }
}
