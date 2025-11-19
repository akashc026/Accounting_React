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
    [Route("debit-memo-line")]
    public class DebitMemoLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DebitMemoLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<DebitMemoLineResultDto>> Get([FromQuery] GetAllDebitMemoLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<DebitMemoLineResultDto>> Get(Guid id)
        {
            try
            {
                GetDebitMemoLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"DebitMemoLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving DebitMemoLine: {ex.Message}");
            }
        }

        [HttpGet("by-debit-memo/{debitMemoId}")]
        public async Task<ActionResult<object>> GetByDebitMemoId(Guid debitMemoId)
        {
            try
            {
                // First check if the debit memo exists
                var debitMemoQuery = new GetDebitMemo { Id = debitMemoId };
                var debitMemo = await _mediator.Send(debitMemoQuery);

                // Then get all debit memo lines for this debit memo
                var query = new GetAllDebitMemoLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.DebitMemoId == debitMemoId).ToList();

                return Ok(new
                {
                    DebitMemoExists = debitMemo != null,
                    DebitMemo = debitMemo,
                    TotalDebitMemoLines = allLines.TotalItems,
                    LinesForThisDebitMemo = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateDebitMemoLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateDebitMemoLine request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteDebitMemoLine request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
}
