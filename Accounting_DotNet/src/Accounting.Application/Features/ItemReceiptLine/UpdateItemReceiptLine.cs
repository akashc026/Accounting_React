using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateItemReceiptLine : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid IRID { get; set; }

        public Guid ItemID { get; set; }

        public int Quantity { get; set; }

        public decimal? Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal? TaxPercent { get; set; }

        public decimal? TaxAmount { get; set; }

        public decimal? TotalAmount { get; set; }

        public int? InvoicedQty { get; set; }

        public Guid? PurchaseOrderLineId { get; set; }
    }
} 
