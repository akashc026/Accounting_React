using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateJournalEntryLinesHandler : IRequestHandler<UpdateJournalEntryLines, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateJournalEntryLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateJournalEntryLines request, CancellationToken cancellationToken)
        {
            if (request.Lines == null || !request.Lines.Any())
            {
                return 0;
            }

            var ids = request.Lines.Select(l => l.Id).ToList();
            var existingLines = await _dbContext.JournalEntryLines
                .Where(line => ids.Contains(line.Id))
                .ToListAsync(cancellationToken);

            if (!existingLines.Any())
            {
                return 0;
            }

            foreach (var existingLine in existingLines)
            {
                var updateDto = request.Lines.FirstOrDefault(l => l.Id == existingLine.Id);
                if (updateDto != null)
                {
                    existingLine.Debit = updateDto.Debit;
                    existingLine.Credit = updateDto.Credit;
                    existingLine.RecordID = updateDto.RecordID;
                    existingLine.Memo = updateDto.Memo;
                    existingLine.RecordType = updateDto.RecordType;
                    existingLine.Account = updateDto.Account;
                    existingLine.JEID = updateDto.JEID;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingLines.Count;
        }
    }
}
