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
    [Route("credit-memo-line")]
    public class CreditMemoLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CreditMemoLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CreditMemoLineResultDto>> Get([FromQuery] GetAllCreditMemoLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CreditMemoLineResultDto>> Get(Guid id)
        {
            try
            {
                GetCreditMemoLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"CreditMemoLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CreditMemoLine: {ex.Message}");
            }
        }

        [HttpGet("by-credit-memo/{creditMemoId}")]
        public async Task<ActionResult<object>> GetByCreditMemoId(Guid creditMemoId)
        {
            try
            {
                // First check if the credit memo exists
                var creditMemoQuery = new GetCreditMemo { Id = creditMemoId };
                var creditMemo = await _mediator.Send(creditMemoQuery);

                // Then get all credit memo lines for this credit memo
                var query = new GetAllCreditMemoLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.CMID == creditMemoId).ToList();

                return Ok(new
                {
                    CreditMemoExists = creditMemo != null,
                    CreditMemo = creditMemo,
                    TotalCreditMemoLines = allLines.TotalItems,
                    LinesForThisCreditMemo = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCreditMemoLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCreditMemoLine request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCreditMemoLine request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
}
