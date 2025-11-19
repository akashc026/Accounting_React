using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetJournalEntryByRecordIDHandler : DbQueryHandler<AccountingDbContext, JournalEntry, GetJournalEntryByRecordID, JournalEntry?, JournalEntryResultDto?>
    {
        protected readonly IMapper Mapper;

        public GetJournalEntryByRecordIDHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext)
        {
            Mapper = mapper;
        }

        public override async Task<JournalEntryResultDto?> Handle(GetJournalEntryByRecordID request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                // Get the JournalEntry by RecordID
                var journalEntry = await Entities
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.RecordID == request.RecordID, cancellationToken);

                return new(request, journalEntry, journalEntry is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override Expression<Func<JournalEntry, bool>> ComposeFilter(Expression<Func<JournalEntry, bool>> predicate, GetJournalEntryByRecordID request)
        {
            return predicate.And(x => x.RecordID == request.RecordID);
        }

        protected override JournalEntryResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetJournalEntryByRecordID, JournalEntry?> args)
        {
            var journalEntry = args.Result;
            if (journalEntry == null) return null;

            var dto = Mapper.Map<JournalEntryResultDto>(journalEntry);
            dto.FormName = journalEntry.FormNavigation?.FormName;

            // Get the related JournalEntryLines by RecordID
            var journalEntryLines = DbContext.JournalEntryLines
                .Include(x => x.AccountNavigation)
                .Where(x => x.RecordID == journalEntry.RecordID)
                .ToList();

            // Map the journal entry lines
            if (journalEntryLines != null && journalEntryLines.Any())
            {
                dto.JournalEntryLines = journalEntryLines.Select(line => new JournalEntryLineDto
                {
                    Id = line.Id,
                    Debit = line.Debit,
                    Credit = line.Credit,
                    RecordID = line.RecordID,
                    Memo = line.Memo,
                    RecordType = line.RecordType,
                    Account = line.Account,
                    AccountName = line.AccountNavigation?.Name,
                    JEID = line.JEID
                }).ToList();
            }

            return dto;
        }
    }
}
