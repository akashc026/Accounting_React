using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

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
        public async Task<List<Guid>> Create(CreateCustomFieldValues request)
        {
            return await mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateCustomFieldValues request)
        {
            var updatedCount = await mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} custom field value(s) updated successfully" });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteCustomFieldValues request)
        {
            var deletedCount = await mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} custom field value(s) deleted successfully" });
        }
    }
} 