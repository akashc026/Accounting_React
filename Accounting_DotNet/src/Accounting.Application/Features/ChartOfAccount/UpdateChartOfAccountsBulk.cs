using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class UpdateChartOfAccountsBulk : IRequest<int>
    {
        public List<ChartOfAccountUpdateDto> Accounts { get; set; } = new();
    }

    public class ChartOfAccountUpdateDto
    {
        public Guid Id { get; set; }

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
