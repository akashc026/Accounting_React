using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FormSequenceController : ControllerBase
    {
        private readonly IMediator mediator;

        public FormSequenceController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<FormSequenceResultDto>> Get([FromQuery] GetAllFormSequence request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-form/{formId:guid}")]
        public async Task<List<FormSequenceResultDto>> GetByFormId(Guid formId)
        {
            GetFormSequencesByFormId request = new() { FormId = formId };
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<FormSequenceResultDto> Get(Guid id)
        {
            GetFormSequence request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateFormSequence request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateFormSequence request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteFormSequence request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 