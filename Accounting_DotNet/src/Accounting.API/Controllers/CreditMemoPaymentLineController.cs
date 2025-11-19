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
    [Route("credit-memo-payment-line")]
    public class CreditMemoPaymentLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CreditMemoPaymentLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CreditMemoPaymentLineResultDto>> Get([FromQuery] GetAllCreditMemoPaymentLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CreditMemoPaymentLineResultDto>> Get(Guid id)
        {
            try
            {
                GetCreditMemoPaymentLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"CreditMemoPaymentLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CreditMemoPaymentLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<List<Guid>>> Create([FromBody] CreateCreditMemoPaymentLines request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating CreditMemoPaymentLine: {ex.Message}");
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] UpdateCreditMemoPaymentLines request)
        {
            try
            {
                var updatedCount = await _mediator.Send(request);
                return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} credit memo payment line(s) updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating CreditMemoPaymentLine: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete([FromBody] DeleteCreditMemoPaymentLines request)
        {
            try
            {
                var deletedCount = await _mediator.Send(request);
                return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} credit memo payment line(s) deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting CreditMemoPaymentLine: {ex.Message}");
            }
        }

        [HttpGet("by-credit-memo/{creditMemoId}")]
        public async Task<ActionResult<object>> GetByCreditMemoId(Guid creditMemoId)
        {
            try
            {
                // Get all credit memo payment lines for this credit memo
                var query = new GetAllCreditMemoPaymentLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.CMID == creditMemoId).ToList();

                return Ok(new
                {
                    TotalCreditMemoPaymentLines = allLines.TotalItems,
                    LinesForThisCreditMemo = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpGet("by-record-id/{recordId}")]
        public async Task<ActionResult<IEnumerable<CreditMemoPaymentLineResultDto>>> GetByRecordId(string recordId)
        {
            try
            {
                var query = new GetAllCreditMemoPaymentLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.RecordID == recordId).ToList();
                
                return Ok(filteredLines);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CreditMemoPaymentLines by RecordID: {ex.Message}");
            }
        }
    }
}
