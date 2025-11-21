using Accounting.Persistence;
using Accounting.Persistence.Models;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    internal static class ChartOfAccountRunningBalanceHelper
    {
        public static async Task PropagateToParentsAsync(AccountingDbContext dbContext, ChartOfAccount entity, decimal previousRunningBalance, CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(dbContext);
            ArgumentNullException.ThrowIfNull(entity);

            if (entity.IsParent == true || !entity.Parent.HasValue)
            {
                return;
            }

            var currentRunningBalance = entity.RunningBalance ?? 0m;
            var delta = currentRunningBalance - previousRunningBalance;

            if (delta == 0m)
            {
                return;
            }

            HashSet<Guid> visitedParentIds = new();
            Guid? parentId = entity.Parent;

            while (parentId.HasValue && visitedParentIds.Add(parentId.Value))
            {
                var parent = await dbContext.ChartOfAccounts.FindAsync(new object?[] { parentId.Value }, cancellationToken);
                if (parent is null)
                {
                    break;
                }

                parent.RunningBalance = (parent.RunningBalance ?? 0m) + delta;
                parentId = parent.Parent;
            }
        }
    }
}
