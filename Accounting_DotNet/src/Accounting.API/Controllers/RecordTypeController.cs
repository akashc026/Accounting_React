using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class RecordTypeController : ControllerBase
    {
        private readonly IMediator mediator;

        public RecordTypeController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<List<RecordTypeResultDto>> Get([FromQuery] GetAllRecordType request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<RecordTypeResultDto> Get(Guid id)
        {
            GetRecordType request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpGet("by-name/{name}")]
        public async Task<RecordTypeResultDto?> GetByName(string name)
        {
            GetRecordTypeByName request = new() { Name = name };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateRecordType request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateRecordType request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteRecordType request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 