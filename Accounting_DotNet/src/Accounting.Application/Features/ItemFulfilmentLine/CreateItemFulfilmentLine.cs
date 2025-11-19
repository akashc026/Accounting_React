using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateItemFulfilmentLine : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public Guid DNID { get; set; }

        public Guid ItemID { get; set; }

        public Guid? TaxID { get; set; }

        public decimal Quantity { get; set; }

        public decimal Rate { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public int? InvoicedQty { get; set; }

        public Guid? SalesOrderLineId { get; set; }
    }
} 