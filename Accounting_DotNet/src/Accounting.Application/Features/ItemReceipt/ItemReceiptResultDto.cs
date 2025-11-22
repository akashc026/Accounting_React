using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class ItemReceiptResultDto
    {
        public Guid Id { get; set; }

        public Guid VendorID { get; set; }

        public string? VendorName { get; set; }

        public Guid POID { get; set; }

        public string? PONumber { get; set; }

        public DateTime? ReceiptDate { get; set; }

        public Guid? Status { get; set; }

        public string? StatusName { get; set; }

        public Guid LocationID { get; set; }

        public string? LocationName { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid? Form { get; set; }

        public string? FormName { get; set; }

        public string? SequenceNumber { get; set; }

        public bool? Inactive { get; set; }

        public decimal? Discount { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }


        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





} 
