using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateInventoryLedger : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public Guid? ItemID { get; set; }

        public TransactionType? TransactionType { get; set; }

        public string? ReferenceId { get; set; }

        public decimal? QuantityChange { get; set; }

        public decimal? Rate { get; set; }

        public DateTime? Date { get; set; }

        public Guid? LocationID { get; set; }

        public string? CreatedBy { get; set; }
    }
} 
