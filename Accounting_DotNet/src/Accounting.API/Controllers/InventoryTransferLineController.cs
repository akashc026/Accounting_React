using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("inventory-transfer-line")]
    public class InventoryTransferLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InventoryTransferLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] CreateInventoryTransferLine command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Guid>> Update(Guid id, [FromBody] UpdateInventoryTransferLine command)
        {
            command.Id = id;
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryTransferLineResultDto>> Get(Guid id)
        {
            var query = new GetInventoryTransferLine { Id = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedList<InventoryTransferLineResultDto>>> GetAll([FromQuery] GetAllInventoryTransferLine query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("by-transfer/{transferId}")]
        public async Task<ActionResult<object>> GetByInventoryTransferId(Guid transferId)
        {
            try
            {
                var transferQuery = new GetInventoryTransfer { Id = transferId };
                var transfer = await _mediator.Send(transferQuery);

                var query = new GetAllInventoryTransferLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.InventoryTransferID == transferId).ToList();

                return Ok(new
                {
                    InventoryTransferExists = transfer != null,
                    InventoryTransfer = transfer,
                    TotalInventoryTransferLines = allLines.TotalItems,
                    LinesForThisInventoryTransfer = filteredLines.Count,
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
            var command = new DeleteInventoryTransferLine { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }
    }
}

