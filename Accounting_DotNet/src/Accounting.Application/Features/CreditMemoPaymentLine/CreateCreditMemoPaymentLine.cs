using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateCreditMemoPaymentLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public decimal PaymentAmount { get; set; }

        public string RecordID { get; set; } = null!;

        public bool? IsApplied { get; set; }

        public string? RefNo { get; set; }

        public string? RecordType { get; set; }

        public Guid? CMID { get; set; }

        public string? CreditMemoSeqNum { get; set; }

        public decimal? MainRecordAmount { get; set; }
    }
}
