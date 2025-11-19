using MediatR;

namespace Accounting.Application.Features
{
    public class GetJournalEntryLinesByRecordId : IRequest<List<JournalEntryLineResultDto>>
    {
        public string RecordId { get; set; } = string.Empty;
    }
}
