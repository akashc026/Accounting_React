using Accounting.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Services
{
    public class SalesOrderNumberService : ISalesOrderNumberService
    {
        private readonly AccountingDbContext _context;

        public SalesOrderNumberService(AccountingDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateSalesOrderNumberAsync(CancellationToken cancellationToken = default)
        {
            // Use a transaction to lock and update safely
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var sequenceRow = await _context.SalesOrderNumberSequences
                    .FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);

                if (sequenceRow == null)
                {
                    // Initialize the sequence if it doesn't exist
                    sequenceRow = new Accounting.Persistence.Models.SalesOrderNumberSequence
                    {
                        Id = 1,
                        LastNumber = 0
                    };
                    _context.SalesOrderNumberSequences.Add(sequenceRow);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                var nextNumber = sequenceRow.LastNumber + 1;
                var salesOrderNumber = $"SO-{nextNumber:D4}"; // D4 = 4-digit format like 0001

                // Update the sequence in DB
                sequenceRow.LastNumber = nextNumber;
                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return salesOrderNumber;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }
} 