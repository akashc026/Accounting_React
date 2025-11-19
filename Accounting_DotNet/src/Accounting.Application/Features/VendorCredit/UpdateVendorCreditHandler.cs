using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateVendorCreditHandler : IRequestHandler<UpdateVendorCredit, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateVendorCreditHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateVendorCredit request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.VendorCredits.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"VendorCredit with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
                
            if (request.VendorID.HasValue)
                entity.VendorID = request.VendorID.Value;
                
            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
            if (request.Applied.HasValue)
                entity.Applied = request.Applied.Value;
                
            if (request.UnApplied.HasValue)
                entity.UnApplied = request.UnApplied.Value;
            
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;
                
            if (request.TranDate.HasValue)
                entity.TranDate = request.TranDate.Value;
                
            if (request.Status.HasValue)
                entity.Status = request.Status.Value;

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
