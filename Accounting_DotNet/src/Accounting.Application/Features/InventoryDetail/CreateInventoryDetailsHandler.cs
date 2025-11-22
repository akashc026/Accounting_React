using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateInventoryDetailsHandler : IRequestHandler<CreateInventoryDetails, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateInventoryDetailsHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateInventoryDetails request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Details == null || !request.Details.Any())
            {
                return createdIds;
            }

            foreach (var detailDto in request.Details)
            {
                var inventoryDetail = new InventoryDetail
                {
                    Id = Guid.NewGuid(),
                    LocationId = detailDto.LocationId,
                    QuantityAvailable = detailDto.QuantityAvailable,
                    ItemId = detailDto.ItemId,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.InventoryDetails.Add(inventoryDetail);
                createdIds.Add(inventoryDetail.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
