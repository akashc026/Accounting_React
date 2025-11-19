using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

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
            // Debug: Log the received parameters (remove in production)
            Console.WriteLine($"CONTROLLER - ItemId: {request.ItemId}, LocationId: {request.LocationId}");
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
        public async Task<Guid> Create(CreateInventoryDetail request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInventoryDetail request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            var request = new DeleteInventoryDetail { Id = id };
            await _mediator.Send(request);
        }
    }
}
