using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateVendorCreditPaymentLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();
        public decimal? PaymentAmount { get; set; }
        public string? RecordID { get; set; }
        public bool? IsApplied { get; set; }
        public string? RefNo { get; set; }
        public string? RecordType { get; set; }
        public Guid? VCID { get; set; }
        public string? VendorCreditSeqNum { get; set; }
        public decimal? MainRecordAmount { get; set; }
    }
}
