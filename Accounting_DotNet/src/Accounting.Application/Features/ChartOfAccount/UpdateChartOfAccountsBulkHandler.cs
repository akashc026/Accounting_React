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
    public class UpdateChartOfAccountsBulkHandler : IRequestHandler<UpdateChartOfAccountsBulk, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateChartOfAccountsBulkHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateChartOfAccountsBulk request, CancellationToken cancellationToken)
        {
            if (request.Accounts == null || !request.Accounts.Any())
            {
                return 0;
            }

            var ids = request.Accounts.Select(a => a.Id).ToList();
            var existingAccounts = await _dbContext.ChartOfAccounts
                .Where(account => ids.Contains(account.Id))
                .ToListAsync(cancellationToken);

            if (!existingAccounts.Any())
            {
                return 0;
            }

            foreach (var existingAccount in existingAccounts)
            {
                var updateDto = request.Accounts.FirstOrDefault(a => a.Id == existingAccount.Id);
                if (updateDto != null)
                {
                    // Only update fields that are provided (not null/empty)
                    if (!string.IsNullOrEmpty(updateDto.Name))
                        existingAccount.Name = updateDto.Name;

                    if (!string.IsNullOrEmpty(updateDto.AccountNumber))
                        existingAccount.AccountNumber = updateDto.AccountNumber;

                    if (updateDto.AccountType.HasValue)
                        existingAccount.AccountType = updateDto.AccountType;

                    if (updateDto.OpeningBalance.HasValue)
                        existingAccount.OpeningBalance = updateDto.OpeningBalance;

                    if (updateDto.Inactive.HasValue)
                        existingAccount.Inactive = updateDto.Inactive;

                    if (updateDto.Notes != null)
                        existingAccount.Notes = updateDto.Notes;

                    if (updateDto.ParentNumber != null)
                        existingAccount.ParentNumber = updateDto.ParentNumber;

                    if (updateDto.IsParent.HasValue)
                        existingAccount.IsParent = updateDto.IsParent;

                    if (updateDto.Parent.HasValue)
                        existingAccount.Parent = updateDto.Parent;

                    if (updateDto.RunningBalance.HasValue)
                        existingAccount.RunningBalance = updateDto.RunningBalance;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingAccounts.Count;
        }
    }
}
