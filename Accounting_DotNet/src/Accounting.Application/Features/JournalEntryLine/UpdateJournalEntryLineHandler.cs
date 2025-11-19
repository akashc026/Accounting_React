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
    public class UpdateJournalEntryLineHandler : IRequestHandler<UpdateJournalEntryLine, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateJournalEntryLineHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateJournalEntryLine request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.JournalEntryLines.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            
            if (entity == null)
                throw new KeyNotFoundException($"JournalEntryLine with ID {request.Id} not found.");

            // Update fields
            if (request.Debit.HasValue)
                entity.Debit = request.Debit.Value;
                
            if (request.Credit.HasValue)
                entity.Credit = request.Credit.Value;
                
            if (request.RecordID != null)
                entity.RecordID = request.RecordID;
                
            if (request.Memo != null)
                entity.Memo = request.Memo;
                
            if (request.RecordType != null)
                entity.RecordType = request.RecordType;
                
            if (request.Account.HasValue)
                entity.Account = request.Account.Value;
                
            if (request.JEID.HasValue)
                entity.JEID = request.JEID.Value;

            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.Id;
        }
    }
}
