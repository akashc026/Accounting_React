using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class CustomFieldValueController : ControllerBase
    {
        private readonly IMediator mediator;

        public CustomFieldValueController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CustomFieldValueResultDto>> Get([FromQuery] GetAllCustomFieldValue request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-type-and-record")]
        public async Task<List<CustomFieldValueResultDto>> GetByTypeAndRecord([FromQuery] Guid typeOfRecord, [FromQuery] string? recordId)
        {
            GetCustomFieldValuesByTypeAndRecord request = new() 
            { 
                TypeOfRecord = typeOfRecord, 
                RecordID = recordId 
            };
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<CustomFieldValueResultDto> Get(Guid id)
        {
            GetCustomFieldValue request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCustomFieldValue request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCustomFieldValue request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCustomFieldValue request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 