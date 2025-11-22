using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CustomerPaymentResultDto
    {
        public Guid Id { get; set; }

        public Guid? Location { get; set; }

        public string? LocationName { get; set; }

        public Guid Customer { get; set; }

        public string? CustomerName { get; set; }

        public Guid Form { get; set; }

        public string? FormName { get; set; }

        public decimal? Amount { get; set; }

        public decimal? AppliedAmount { get; set; }

        public decimal? UnAppliedAmount { get; set; }

        public string SequenceNumber { get; set; } = null!;

        public DateTime? PaymentDate { get; set; }

        public Guid? Status { get; set; }

        public string? StatusName { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
