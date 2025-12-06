using Accounting.API.Contracts;
using Accounting.API.Services;
using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ItemFulfilmentController : ControllerBase
    {
        private readonly IMediator mediator;
        private readonly IJournalGenerationService journalGenerationService;
        private readonly ItemFulfilmentMergeService _mergeService;

        public ItemFulfilmentController(IMediator mediator, IJournalGenerationService journalGenerationService, ItemFulfilmentMergeService mergeService)
        {
            this.mediator = mediator;
            this.journalGenerationService = journalGenerationService;
            _mergeService = mergeService;
        }

        [HttpGet]
        public async Task<PaginatedList<ItemFulfilmentResultDto>> Get([FromQuery] GetAllItemFulfilment request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ItemFulfilmentResultDto> Get(Guid id)
        {
            GetItemFulfilment request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateItemFulfilment request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateItemFulfilment request)
        {
            request.Id = id;
            var result = await mediator.Send(request);

            await mediator.Send(new SyncSalesOrderFulfillmentQuantities
            {
                ItemFulfilmentId = id
            });

            return result;
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteItemFulfilment request = new() { Id = id };
            await mediator.Send(request);

            await journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "ItemFulfillment",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }

        [HttpPost("merge")]
        public Task<ActionResult<Guid>> Merge([FromBody] ItemFulfilmentMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: false);
        }

        [HttpPut("merge")]
        public Task<ActionResult<Guid>> MergeUpdate([FromBody] ItemFulfilmentMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: true);
        }

        private async Task<ActionResult<Guid>> HandleMergeAsync(ItemFulfilmentMergeRequest request, bool isUpdateRequest)
        {
            try
            {
                var id = await _mergeService.MergeAsync(request, isUpdateRequest);
                return Ok(id);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }
    }
}
