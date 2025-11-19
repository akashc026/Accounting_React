using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class TaxResultDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TaxRate { get; set; }

        public Guid? TaxAccount { get; set; }

        public bool? Inactive { get; set; }

        public string? TaxAccountName { get; set; }

    }
}