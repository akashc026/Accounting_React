using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateJournalEntryLinesHandler : IRequestHandler<CreateJournalEntryLines, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateJournalEntryLinesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateJournalEntryLines request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Lines == null || !request.Lines.Any())
            {
                return createdIds;
            }

            foreach (var lineDto in request.Lines)
            {
                var journalEntryLine = new JournalEntryLine
                {
                    Id = Guid.NewGuid(),
                    Debit = lineDto.Debit,
                    Credit = lineDto.Credit,
                    RecordID = lineDto.RecordID,
                    Memo = lineDto.Memo,
                    RecordType = lineDto.RecordType,
                    Account = lineDto.Account,
                    JEID = lineDto.JEID,
                    CreatedBy = request.CreatedBy ?? string.Empty
                };

                _dbContext.JournalEntryLines.Add(journalEntryLine);
                createdIds.Add(journalEntryLine.Id);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
