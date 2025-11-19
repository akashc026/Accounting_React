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
    public class DeleteInventoryDetailsHandler : IRequestHandler<DeleteInventoryDetails, int>
    {
        private readonly AccountingDbContext _dbContext;

        public DeleteInventoryDetailsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(DeleteInventoryDetails request, CancellationToken cancellationToken)
        {
            if (request.Ids == null || !request.Ids.Any())
            {
                return 0;
            }

            var detailsToDelete = await _dbContext.InventoryDetails
                .Where(detail => request.Ids.Contains(detail.Id))
                .ToListAsync(cancellationToken);

            if (!detailsToDelete.Any())
            {
                return 0;
            }

            _dbContext.InventoryDetails.RemoveRange(detailsToDelete);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return detailsToDelete.Count;
        }
    }
}
