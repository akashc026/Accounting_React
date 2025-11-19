using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("inventory-detail")]
    public class InventoryDetailController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InventoryDetailController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<InventoryDetailResultDto>> Get([FromQuery] GetAllInventoryDetail request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<InventoryDetailResultDto>> Get(Guid id)
        {
            var request = new GetInventoryDetail { Id = id };
            var result = await _mediator.Send(request);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreateInventoryDetails request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateInventoryDetails request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} inventory detail(s) updated successfully" });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteInventoryDetails request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} inventory detail(s) deleted successfully" });
        }
    }
}
