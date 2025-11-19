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
    public class UpdateInventoryDetailsHandler : IRequestHandler<UpdateInventoryDetails, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateInventoryDetailsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateInventoryDetails request, CancellationToken cancellationToken)
        {
            if (request.Details == null || !request.Details.Any())
            {
                return 0;
            }

            var ids = request.Details.Select(d => d.Id).ToList();
            var existingDetails = await _dbContext.InventoryDetails
                .Where(detail => ids.Contains(detail.Id))
                .ToListAsync(cancellationToken);

            if (!existingDetails.Any())
            {
                return 0;
            }

            foreach (var existingDetail in existingDetails)
            {
                var updateDto = request.Details.FirstOrDefault(d => d.Id == existingDetail.Id);
                if (updateDto != null)
                {
                    // Only update fields that are provided (not null)
                    if (updateDto.LocationId.HasValue)
                        existingDetail.LocationId = updateDto.LocationId;

                    if (updateDto.QuantityAvailable.HasValue)
                        existingDetail.QuantityAvailable = updateDto.QuantityAvailable;

                    if (updateDto.ItemId.HasValue)
                        existingDetail.ItemId = updateDto.ItemId;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingDetails.Count;
        }
    }
}
