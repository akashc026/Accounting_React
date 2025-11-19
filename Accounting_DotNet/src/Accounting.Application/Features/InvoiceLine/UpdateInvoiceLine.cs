using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateInvoiceLine : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public Guid INID { get; set; }

        public Guid ItemID { get; set; }

        public decimal QuantityDelivered { get; set; }

        public decimal Rate { get; set; }

        public Guid? TaxID { get; set; }

        public decimal TaxPercent { get; set; }

        public decimal TaxRate { get; set; }

        public decimal TaxAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public Guid? itemFulfillmentLineId { get; set; }
    }
} 