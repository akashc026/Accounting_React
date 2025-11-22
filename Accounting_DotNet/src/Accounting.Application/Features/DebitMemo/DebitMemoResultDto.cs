using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DebitMemoResultDto
    {
        public Guid Id { get; set; }

        public Guid CustomerID { get; set; }

        public string? CustomerName { get; set; }

        public Guid LocationID { get; set; }

        public string? LocationName { get; set; }

        public DateTime TranDate { get; set; }

        public decimal TotalAmount { get; set; }

        public Guid Form { get; set; }

        public string? FormName { get; set; }

        public string? SequenceNumber { get; set; }

        public decimal? AmountDue { get; set; }

        public decimal? AmountPaid { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public Guid? Status { get; set; }

        public string? StatusName { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
