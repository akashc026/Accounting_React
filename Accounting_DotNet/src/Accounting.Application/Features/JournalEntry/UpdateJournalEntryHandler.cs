using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateJournalEntryHandler : IRequestHandler<UpdateJournalEntry, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateJournalEntryHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateJournalEntry request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.JournalEntries.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"JournalEntry with ID {request.Id} not found.");

            // Update fields
            if (request.JournalAmount.HasValue)
                entity.JournalAmount = request.JournalAmount.Value;
                
            if (request.Form.HasValue)
                entity.Form = request.Form.Value;
                
            if (request.SequenceNumber != null)
                entity.SequenceNumber = request.SequenceNumber;
                
            if (request.TranDate.HasValue)
                entity.TranDate = request.TranDate.Value;
                
            if (request.Memo != null)
                entity.Memo = request.Memo;
                
            if (request.RecordID != null)
                entity.RecordID = request.RecordID;
                
            if (request.RecordType != null)
                entity.RecordType = request.RecordType;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}
