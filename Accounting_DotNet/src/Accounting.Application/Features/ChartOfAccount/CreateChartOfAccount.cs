using ExcentOne.Application.Features.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateChartOfAccount : ICreateEntity<Guid, Guid>
    {
        public Guid Id => Guid.NewGuid();

        public string? Name { get; set; }

        public string? AccountNumber { get; set; }

        public Guid? AccountType { get; set; }

        public decimal? OpeningBalance { get; set; }

        public bool? Inactive { get; set; }

        public string? Notes { get; set; }

        public string? ParentNumber { get; set; }

        public bool? IsParent { get; set; }

        public Guid? Parent { get; set; }

        public decimal? RunningBalance { get; set; }
    }
}
