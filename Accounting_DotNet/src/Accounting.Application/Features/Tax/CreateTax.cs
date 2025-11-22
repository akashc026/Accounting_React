using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateTax : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string Name { get; set; } = null!;

        public decimal TaxRate { get; set; }

        public Guid? TaxAccount { get; set; }

        public bool? Inactive { get; set; }

        public string? CreatedBy { get; set; }
    }
} 
