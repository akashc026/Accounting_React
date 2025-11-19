using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FormController : ControllerBase
    {
        private readonly IMediator mediator;

        public FormController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<FormResultDto>> Get([FromQuery] GetAllForm request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-type-of-record/{typeOfRecord:guid}")]
        public async Task<List<FormResultDto>> GetByTypeOfRecord(Guid typeOfRecord)
        {
            GetFormsByTypeOfRecord request = new() { TypeOfRecord = typeOfRecord };
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<FormResultDto> Get(Guid id)
        {
            GetForm request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateForm request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateForm request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteForm request = new() { Id = id };
            await mediator.Send(request);
        }

        [HttpGet("check-name-exists")]
        public async Task<bool> CheckFormNameExists([FromQuery] string formName, [FromQuery] Guid typeOfRecord)
        {
            CheckFormNameExists request = new() { FormName = formName, TypeOfRecord = typeOfRecord };
            return await mediator.Send(request);
        }

        [HttpGet("check-prefix-exists")]
        public async Task<bool> CheckFormPrefixExists([FromQuery] string prefix, [FromQuery] Guid typeOfRecord)
        {
            CheckFormPrefixExists request = new() { Prefix = prefix, TypeOfRecord = typeOfRecord };
            return await mediator.Send(request);
        }

        [HttpGet("default-form-id/{typeOfRecord:guid}")]
        public async Task<ActionResult<Guid?>> GetDefaultFormId(Guid typeOfRecord)
        {
            GetDefaultFormId request = new() { TypeOfRecord = typeOfRecord };
            var result = await mediator.Send(request);
            return Ok(result);
        }

        [HttpPatch("{id:guid}/is-default")]
        public async Task<Guid> UpdateFormIsDefault(Guid id, [FromBody] UpdateFormIsDefault request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }
    }
}