using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("journal-entry")]
    public class JournalEntryController : ControllerBase
    {
        private readonly IMediator mediator;

        public JournalEntryController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<JournalEntryResultDto>> Get([FromQuery] GetAllJournalEntry request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<JournalEntryResultDto> Get(Guid id)
        {
            GetJournalEntry request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpGet("by-record-id/{recordId}")]
        public async Task<JournalEntryResultDto> GetByRecordId(string recordId)
        {
            GetJournalEntryByRecordID request = new() { RecordID = recordId };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateJournalEntry request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateJournalEntry request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteJournalEntry request = new() { Id = id };
            await mediator.Send(request);
        }
    }
}
