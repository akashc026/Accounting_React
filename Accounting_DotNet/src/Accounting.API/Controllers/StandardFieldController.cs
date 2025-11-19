using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class StandardFieldController : ControllerBase
    {
        private readonly IMediator mediator;

        public StandardFieldController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<StandardFieldResultDto>> Get([FromQuery] GetAllStandardField request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<StandardFieldResultDto> Get(Guid id)
        {
            GetStandardField request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpGet("by-record-type/{recordTypeId:guid}")]
        public async Task<List<StandardFieldResultDto>> GetByRecordType(Guid recordTypeId)
        {
            GetStandardFieldsByRecordType request = new() 
            { 
                RecordTypeId = recordTypeId
            };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateStandardField request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateStandardField request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteStandardField request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 