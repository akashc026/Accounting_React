using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class InventoryDetailResultDto
    {
        public Guid Id { get; set; }

        public Guid? LocationId { get; set; }

        public decimal? QuantityAvailable { get; set; }

        public string? LocationName { get; set; }
    }
}
