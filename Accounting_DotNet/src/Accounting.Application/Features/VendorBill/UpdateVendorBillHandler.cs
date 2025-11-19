using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateVendorBillHandler : IRequestHandler<UpdateVendorBill, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateVendorBillHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateVendorBill request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.VendorBills.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"VendorBill with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;
                
            if (request.InvoiceDate.HasValue)
                entity.InvoiceDate = request.InvoiceDate.Value;
                
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
                
            if (request.AmountDue.HasValue)
                entity.AmountDue = request.AmountDue.Value;
                
            if (request.AmountPaid.HasValue)
                entity.AmountPaid = request.AmountPaid.Value;
                
            if (request.IRID.HasValue)
                entity.IRID = request.IRID.Value;

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
