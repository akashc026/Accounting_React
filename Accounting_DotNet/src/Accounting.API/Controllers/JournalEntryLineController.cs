using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("journal-entry-line")]
    [ApiController]
    public class JournalEntryLineController : ControllerBase
    {
        private readonly IMediator mediator;

        public JournalEntryLineController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<JournalEntryLineResultDto>> Get([FromQuery] GetAllJournalEntryLine request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-record-id/{recordId}")]
        public async Task<List<JournalEntryLineResultDto>> GetByRecordId(string recordId)
        {
            var request = new GetJournalEntryLinesByRecordId { RecordId = recordId };
            return await mediator.Send(request);
        }

        [HttpGet("by-journal-entry/{journalEntryId}")]
        public async Task<ActionResult<object>> GetByJournalEntryId(Guid journalEntryId)
        {
            try
            {
                // First check if the journal entry exists
                var journalEntryQuery = new GetJournalEntry { Id = journalEntryId };
                var journalEntry = await mediator.Send(journalEntryQuery);
                
                // Then get all journal entry lines for this journal entry
                var query = new GetAllJournalEntryLine { PageSize = 1000 };
                var allLines = await mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.JEID == journalEntryId).ToList();
                
                return Ok(new 
                {
                    JournalEntryExists = journalEntry != null,
                    JournalEntry = journalEntry,
                    TotalJournalEntryLines = allLines.TotalItems,
                    LinesForThisJournalEntry = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<JournalEntryLineResultDto> Get(Guid id)
        {
            GetJournalEntryLine request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreateJournalEntryLines request)
        {
            return await mediator.Send(request);
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteJournalEntryLines request)
        {
            var deletedCount = await mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} journal entry line(s) deleted successfully" });
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateJournalEntryLines request)
        {
            var updatedCount = await mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} journal entry line(s) updated successfully" });
        }
    }
}
