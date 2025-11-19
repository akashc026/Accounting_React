using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class ProductStockResultDto
    {
        public Guid Id { get; set; }

        public Guid? ItemID { get; set; }

        public Guid? LocationID { get; set; }

        public decimal Quantity { get; set; }

        public decimal OpeningStockQty { get; set; }

        public decimal OpeningStockRate { get; set; }
    }
} 