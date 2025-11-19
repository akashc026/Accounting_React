using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsBalances : IRequest<List<ChartOfAccountBalanceDto>>
    {
        public List<Guid> Ids { get; set; } = new();
    }

    public class ChartOfAccountBalanceDto
    {
        public Guid Id { get; set; }

        public decimal? OpeningBalance { get; set; }

        public decimal? RunningBalance { get; set; }
    }
}
