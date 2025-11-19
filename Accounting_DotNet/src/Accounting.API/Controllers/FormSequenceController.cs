using Accounting.Application.Features;
using Accounting.Application.Services;
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
        private readonly IFormSequenceService _formSequenceService;

        public FormSequenceController(IMediator mediator, IFormSequenceService formSequenceService)
        {
            this.mediator = mediator;
            _formSequenceService = formSequenceService;
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

        /// <summary>
        /// Generates the next sequence number for a form in a thread-safe manner
        /// </summary>
        /// <param name="formId">The form ID to generate sequence for</param>
        /// <returns>Formatted sequence number (e.g., "CUST0001")</returns>
        [HttpGet("generate-next/{formId:guid}")]
        public async Task<ActionResult<string>> GenerateNextSequenceNumber(Guid formId)
        {
            try
            {
                var sequenceNumber = await _formSequenceService.GenerateNextSequenceNumberAsync(formId);
                return Ok(sequenceNumber);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
} 