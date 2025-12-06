using Accounting.Persistence;
using Accounting.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Services
{
    public class FormSequenceService : IFormSequenceService
    {
        private readonly AccountingDbContext _context;

        public FormSequenceService(AccountingDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateNextSequenceNumberAsync(Guid formId, CancellationToken cancellationToken = default)
        {
            // Reuse an existing transaction when present (e.g., caller opens a unit-of-work transaction),
            // otherwise create a new transaction to protect the sequence increment.
            var ownsTransaction = _context.Database.CurrentTransaction == null;
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
            if (ownsTransaction)
            {
                transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            }

            try
            {
                // Fetch the form to get the prefix
                var form = await _context.Forms
                    .AsNoTracking()
                    .FirstOrDefaultAsync(f => f.Id == formId, cancellationToken);

                if (form == null)
                {
                    throw new InvalidOperationException($"Form with ID {formId} not found.");
                }

                // Fetch or create the sequence record for this form
                var sequenceRecord = await _context.FormSequences
                    .FirstOrDefaultAsync(fs => fs.FormId == formId, cancellationToken);

                if (sequenceRecord == null)
                {
                    // Initialize the sequence if it doesn't exist
                    sequenceRecord = new FormSequence
                    {
                        Id = Guid.NewGuid(),
                        FormId = formId,
                        FormSequenceNumber = 0
                    };
                    _context.FormSequences.Add(sequenceRecord);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                // Increment the sequence number atomically
                var nextNumber = sequenceRecord.FormSequenceNumber + 1;

                // Generate formatted sequence number with prefix
                var prefix = form.Prefix ?? "";
                var formattedSequence = $"{prefix}{nextNumber:D4}"; // D4 = 4-digit format like 0001

                // Update the sequence in database
                sequenceRecord.FormSequenceNumber = nextNumber;
                await _context.SaveChangesAsync(cancellationToken);

                // Commit only if we created the transaction
                if (transaction != null)
                {
                    await transaction.CommitAsync(cancellationToken);
                }

                return formattedSequence;
            }
            catch
            {
                // Rollback only if we created the transaction
                if (transaction != null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                }
                throw;
            }
        }
    }
}
