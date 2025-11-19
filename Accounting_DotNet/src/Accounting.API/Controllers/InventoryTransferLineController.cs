using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

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
        public async Task<List<Guid>> Create(CreateInventoryTransferLines request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateInventoryTransferLines request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} inventory transfer line(s) updated successfully" });
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

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteInventoryTransferLines request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} inventory transfer line(s) deleted successfully" });
        }
    }
}

