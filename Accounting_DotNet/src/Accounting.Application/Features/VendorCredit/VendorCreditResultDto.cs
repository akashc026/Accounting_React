using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class VendorCreditResultDto
    {
        public Guid Id { get; set; }

        public Guid Form { get; set; }

        public string? FormName { get; set; }

        public Guid VendorID { get; set; }

        public string? VendorName { get; set; }

        public Guid LocationID { get; set; }

        public string? LocationName { get; set; }

        public decimal? TotalAmount { get; set; }

        public decimal? Applied { get; set; }

        public decimal? UnApplied { get; set; }

        public string? SequenceNumber { get; set; }

        public DateTime? TranDate { get; set; }

        public Guid? Status { get; set; }

        public string? StatusName { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
