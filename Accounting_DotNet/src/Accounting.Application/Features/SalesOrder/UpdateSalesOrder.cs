using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateSalesOrder : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid? CustomerID { get; set; }

        public DateTime? SODate { get; set; }

        public Guid? Status { get; set; }

        public decimal? TotalAmount { get; set; }

        public Guid? LocationID { get; set; }

        public Guid? Form { get; set; }

        public string? SequenceNumber { get; set; }

        public bool? Inactive { get; set; }

        public decimal? Discount { get; set; }

        public decimal? GrossAmount { get; set; }

        public decimal? TaxTotal { get; set; }

        public decimal? SubTotal { get; set; }

        public decimal? NetTotal { get; set; }
    }
} 