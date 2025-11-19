using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateProduct : IUpdateEntity<Guid, Guid>
    {
        public Guid Id { get; set; }

        public string? ItemCode { get; set; }

        public string? ItemName { get; set; }


        public Guid? ItemType { get; set; }

        public Guid? InventoryAccount { get; set; }

        public Guid? COGSAccount { get; set; }

        public Guid? SalesAccount { get; set; }

        public Guid? ExpenseAccount { get; set; }

        public decimal? SalesPrice { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? StandardCost { get; set; }
        public Guid? PurchaseTaxCode { get; set; }
        public Guid? SalesTaxCode { get; set; }
        public bool? Inactive { get; set; }
        public decimal? AverageCost { get; set; }

        public Guid? Form { get; set; }

        public string? SequenceNumber { get; set; }
    }
} 