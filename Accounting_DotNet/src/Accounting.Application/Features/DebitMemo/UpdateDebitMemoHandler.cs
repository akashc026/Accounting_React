using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateDebitMemoHandler : IRequestHandler<UpdateDebitMemo, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateDebitMemoHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateDebitMemo request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.DebitMemos.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"DebitMemo with ID {request.Id} not found.");

            // Only update fields that have values
            if (request.CustomerID.HasValue)
                entity.CustomerID = request.CustomerID.Value;
                
            if (request.LocationID.HasValue)
                entity.LocationID = request.LocationID.Value;
                
            if (request.TranDate.HasValue)
                entity.TranDate = request.TranDate.Value;
                
            if (request.TotalAmount.HasValue)
                entity.TotalAmount = request.TotalAmount.Value;
                
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

            if (request.Status.HasValue)
                entity.Status = request.Status.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}
