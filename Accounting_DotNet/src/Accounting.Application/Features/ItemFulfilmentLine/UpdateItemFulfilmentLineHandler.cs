using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateItemFulfilmentLineHandler : IRequestHandler<UpdateItemFulfilmentLine, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateItemFulfilmentLineHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateItemFulfilmentLine request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.ItemFulfilmentLines.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"ItemFulfilmentLine with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.DNID.HasValue)
                entity.DNID = request.DNID.Value;
                
            if (request.ItemID.HasValue)
                entity.ItemID = request.ItemID.Value;
                
            if (request.TaxID.HasValue)
                entity.TaxID = request.TaxID.Value;
                
            if (request.Quantity.HasValue)
                entity.Quantity = request.Quantity.Value;
                
            if (request.Rate.HasValue)
                entity.Rate = request.Rate.Value;
                
            if (request.TaxPercent.HasValue)
                entity.TaxPercent = request.TaxPercent.Value;
                
            if (request.TaxAmount.HasValue)
                entity.TaxAmount = request.TaxAmount.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
            if (request.InvoicedQty.HasValue)
                entity.InvoicedQty = request.InvoicedQty.Value;

            if (request.SalesOrderLineId.HasValue)
                entity.SalesOrderLineId = request.SalesOrderLineId.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}