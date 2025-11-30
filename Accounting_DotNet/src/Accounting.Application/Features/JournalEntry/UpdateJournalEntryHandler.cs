using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;

namespace Accounting.Application.Features
{
    public class UpdateJournalEntryHandler : DeleteRestrictedUpdateEntityHandler<JournalEntry, UpdateJournalEntry>
    {
        public UpdateJournalEntryHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        protected override JournalEntry UpdateEntity(UpdateJournalEntry request, JournalEntry entity, IMapper mapper)
        {
            if (request.IsDeleted.HasValue)
                entity.IsDeleted = request.IsDeleted.Value;

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

            return entity;
        }

        protected override string? GetExcludedTables()
        {
            return "JournalEntryLines";
        }
    }
}
