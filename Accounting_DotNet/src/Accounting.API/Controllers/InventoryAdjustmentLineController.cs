using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

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
        public async Task<List<Guid>> Create(CreateInventoryAdjustmentLines request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateInventoryAdjustmentLines request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} inventory adjustment line(s) updated successfully" });
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

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteInventoryAdjustmentLines request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} inventory adjustment line(s) deleted successfully" });
        }
    }
}

