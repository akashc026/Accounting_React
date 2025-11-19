using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateInvoiceHandler : IRequestHandler<UpdateInvoice, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateInvoiceHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateInvoice request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Invoices.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"Invoice with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.CustomerID.HasValue)
                entity.CustomerID = request.CustomerID.Value;
                
            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;
                
            if (request.InvoiceDate.HasValue)
                entity.InvoiceDate = request.InvoiceDate.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
            if (request.Status != null)
                entity.Status = request.Status;

            if (request.DNID != null)
                entity.DNID = request.DNID;
                
            if (request.Inactive.HasValue)
                entity.Inactive = request.Inactive.Value;
                
            if (request.Discount.HasValue)
                entity.Discount = request.Discount.Value;
                
            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
            
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;
                
            if (request.AmountDue.HasValue)
                entity.AmountDue = request.AmountDue.Value;
                
            if (request.AmountPaid.HasValue)
                entity.AmountPaid = request.AmountPaid.Value;

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