using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetJournalEntryLinesByRecordIdHandler : IRequestHandler<GetJournalEntryLinesByRecordId, List<JournalEntryLineResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetJournalEntryLinesByRecordIdHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<JournalEntryLineResultDto>> Handle(GetJournalEntryLinesByRecordId request, CancellationToken cancellationToken)
        {
            var journalEntryLines = await _dbContext.JournalEntryLines
                .Include(x => x.AccountNavigation)
                .Include(x => x.JE)
                .Where(x => x.RecordID == request.RecordId)
                .OrderBy(x => x.Id)
                .ToListAsync(cancellationToken);

            return journalEntryLines.Select(entity => {
                var result = _mapper.Map<JournalEntryLineResultDto>(entity);
                result.AccountName = entity.AccountNavigation?.Name;
                return result;
            }).ToList();
        }
    }
}
