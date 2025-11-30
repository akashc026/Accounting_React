using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Accounting.Application.Services;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("inventory-transfer")]
    public class InventoryTransferController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalGenerationService;

        public InventoryTransferController(IMediator mediator, IJournalGenerationService journalGenerationService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
        }

        [HttpGet]
        public async Task<PaginatedList<InventoryTransferResultDto>> Get([FromQuery] GetAllInventoryTransfer request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<InventoryTransferResultDto>> Get(Guid id)
        {
            var request = new GetInventoryTransfer { Id = id };
            var result = await _mediator.Send(request);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<Guid> Create(CreateInventoryTransfer request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInventoryTransfer request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteInventoryTransfer request = new() { Id = id };
            await _mediator.Send(request);

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "InventoryTransfer",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }
    }
}
