using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class FormSourceTypeController : ControllerBase
    {
        private readonly IMediator mediator;

        public FormSourceTypeController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<IEnumerable<FormSourceTypeResultDto>> Get([FromQuery] GetAllFormSourceType request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<FormSourceTypeResultDto> Get(Guid id)
        {
            GetFormSourceType request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateFormSourceType request)
        {
            try
            {
                var result = await mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Put(Guid id, [FromBody] UpdateFormSourceType request)
        {
            try
            {
                request.Id = id;
                var result = await mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                DeleteFormSourceType request = new() { Id = id };
                await mediator.Send(request);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
