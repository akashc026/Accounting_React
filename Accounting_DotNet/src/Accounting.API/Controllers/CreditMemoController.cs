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
    [Route("credit-memo")]
    public class CreditMemoController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CreditMemoController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CreditMemoResultDto>> Get([FromQuery] GetAllCreditMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CreditMemoResultDto>> Get(Guid id)
        {
            try
            {
                GetCreditMemo request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"CreditMemo with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CreditMemo: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCreditMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCreditMemo request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCreditMemo request = new() { Id = id };
            await _mediator.Send(request);
        }

        [HttpGet("by-customer/{customerId:guid}")]
        public async Task<List<CreditMemoResultDto>> GetByCustomer(Guid customerId)
        {
            GetCreditMemosByCustomer request = new()
            {
                CustomerId = customerId
            };
            return await _mediator.Send(request);
        }
    }
}
