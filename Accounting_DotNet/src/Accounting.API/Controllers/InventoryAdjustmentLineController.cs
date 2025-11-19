using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("inventory-adjustment-line")]
    public class InventoryAdjustmentLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InventoryAdjustmentLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] CreateInventoryAdjustmentLine command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Guid>> Update(Guid id, [FromBody] UpdateInventoryAdjustmentLine command)
        {
            command.Id = id;
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryAdjustmentLineResultDto>> Get(Guid id)
        {
            var query = new GetInventoryAdjustmentLine { Id = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedList<InventoryAdjustmentLineResultDto>>> GetAll([FromQuery] GetAllInventoryAdjustmentLine query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("by-adjustment/{adjustmentId}")]
        public async Task<ActionResult<object>> GetByInventoryAdjustmentId(Guid adjustmentId)
        {
            try
            {
                var adjustmentQuery = new GetInventoryAdjustment { Id = adjustmentId };
                var adjustment = await _mediator.Send(adjustmentQuery);

                var query = new GetAllInventoryAdjustmentLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.InventoryAdjustmentID == adjustmentId).ToList();

                return Ok(new
                {
                    InventoryAdjustmentExists = adjustment != null,
                    InventoryAdjustment = adjustment,
                    TotalInventoryAdjustmentLines = allLines.TotalItems,
                    LinesForThisInventoryAdjustment = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var command = new DeleteInventoryAdjustmentLine { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }
    }
}

