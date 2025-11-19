using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("debit-memo")]
    public class DebitMemoController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DebitMemoController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<DebitMemoResultDto>> Get([FromQuery] GetAllDebitMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<DebitMemoResultDto>> Get(Guid id)
        {
            try
            {
                GetDebitMemo request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"DebitMemo with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving DebitMemo: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateDebitMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateDebitMemo request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteDebitMemo request = new() { Id = id };
            await _mediator.Send(request);
        }

        [HttpGet("by-cust-loc/{customerId:guid}/{locationId:guid}")]
        public async Task<List<DebitMemoResultDto>> GetByCustLoc(Guid customerId, Guid locationId)
        {
            GetDebitMemosByCustLoc request = new()
            {
                CustomerId = customerId,
                LocationId = locationId
            };
            return await _mediator.Send(request);
        }
    }
}
