using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("inventory-adjustment")]
    public class InventoryAdjustmentController : ControllerBase
    {
        private readonly IJournalGenerationService _journalGenerationService;
        private readonly IMediator _mediator;

        public InventoryAdjustmentController(IMediator mediator, IJournalGenerationService journalGenerationService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
        }

        [HttpGet]
        public async Task<PaginatedList<InventoryAdjustmentResultDto>> Get([FromQuery] GetAllInventoryAdjustment request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<InventoryAdjustmentResultDto>> Get(Guid id)
        {
            var request = new GetInventoryAdjustment { Id = id };
            var result = await _mediator.Send(request);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<Guid> Create(CreateInventoryAdjustment request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInventoryAdjustment request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteInventoryAdjustment request = new() { Id = id };
            await _mediator.Send(request);

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "InventoryAdjustment",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }
    }
}
