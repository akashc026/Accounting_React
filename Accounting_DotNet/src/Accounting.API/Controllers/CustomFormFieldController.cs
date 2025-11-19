using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class CustomFormFieldController : ControllerBase
    {
        private readonly IMediator mediator;

        public CustomFormFieldController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CustomFormFieldResultDto>> Get([FromQuery] GetAllCustomFormField request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-form/{formId:guid}")]
        public async Task<List<CustomFormFieldResultDto>> GetByFormId(Guid formId)
        {
            GetCustomFormFieldsByFormId request = new() { FormId = formId };
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<CustomFormFieldResultDto> Get(Guid id)
        {
            GetCustomFormField request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCustomFormField request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCustomFormField request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCustomFormField request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 