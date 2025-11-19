using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsBalancesHandler : IRequestHandler<GetChartOfAccountsBalances, List<ChartOfAccountBalanceDto>>
    {
        private readonly AccountingDbContext _dbContext;

        public GetChartOfAccountsBalancesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<ChartOfAccountBalanceDto>> Handle(GetChartOfAccountsBalances request, CancellationToken cancellationToken)
        {
            if (request.Ids == null || !request.Ids.Any())
            {
                return new List<ChartOfAccountBalanceDto>();
            }

            var accounts = await _dbContext.ChartOfAccounts
                .Where(account => request.Ids.Contains(account.Id))
                .Select(account => new ChartOfAccountBalanceDto
                {
                    Id = account.Id,
                    OpeningBalance = account.OpeningBalance,
                    RunningBalance = account.RunningBalance
                })
                .ToListAsync(cancellationToken);

            return accounts;
        }
    }
}
