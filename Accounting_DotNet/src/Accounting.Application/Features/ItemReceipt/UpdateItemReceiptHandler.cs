using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateItemReceiptHandler : IRequestHandler<UpdateItemReceipt, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateItemReceiptHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateItemReceipt request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.ItemReceipts.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"ItemReceipt with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;
                
            if (request.POID.HasValue)
                entity.POID = request.POID.Value;
                
            if (request.ReceiptDate.HasValue)
                entity.ReceiptDate = request.ReceiptDate.Value;
                
            if (request.Status.HasValue)
                entity.Status = request.Status.Value;
                
            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
                
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;
                
            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive.Value;
                
            if (request.Discount.HasValue)
                entity.Discount = request.Discount.Value;

            if (request.GrossAmount.HasValue)
                entity.GrossAmount = request.GrossAmount.Value;

            if (request.TaxTotal.HasValue)
                entity.TaxTotal = request.TaxTotal.Value;

            if (request.SubTotal.HasValue)
                entity.SubTotal = request.SubTotal.Value;

            if (request.NetTotal.HasValue)
                entity.NetTotal = request.NetTotal.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
} 
