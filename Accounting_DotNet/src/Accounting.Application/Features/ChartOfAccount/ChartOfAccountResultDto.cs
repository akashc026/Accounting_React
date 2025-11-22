using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class ChartOfAccountResultDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string AccountNumber { get; set; } = null!;

        public Guid? AccountType { get; set; }

        public string? AccountTypeName { get; set; }

        public decimal? OpeningBalance { get; set; }

        public bool? Inactive { get; set; }

        public string? Notes { get; set; }

        public string? ParentNumber { get; set; }

        public bool? IsParent { get; set; }

        public Guid? Parent { get; set; }

        public string? ParentName { get; set; }

        public decimal? RunningBalance { get; set; }



        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
