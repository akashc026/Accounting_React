using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateSalesOrderLineHandler : IRequestHandler<UpdateSalesOrderLine, Guid>
    {
        private readonly AccountingDbContext _dbContext;
         
        public UpdateSalesOrderLineHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateSalesOrderLine request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.SalesOrderLines.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"SalesOrderLine with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.SOID.HasValue)
                entity.SOID = request.SOID.Value;
                
            if (request.ItemID.HasValue)
                entity.ItemID = request.ItemID.Value;
                
            if (request.Quantity.HasValue)
                entity.Quantity = request.Quantity.Value;
                
            if (request.Rate.HasValue)
                entity.Rate = request.Rate.Value;
                
            if (request.TaxID.HasValue)
                entity.TaxID = request.TaxID.Value;
                
            if (request.TaxPercent.HasValue)
                entity.TaxPercent = request.TaxPercent.Value;
                
            if (request.TaxAmount.HasValue)
                entity.TaxAmount = request.TaxAmount.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
            if (request.FulFillQty.HasValue)
                entity.FulFillQty = request.FulFillQty.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}