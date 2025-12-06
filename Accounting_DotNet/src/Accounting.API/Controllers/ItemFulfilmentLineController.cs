using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ItemFulfilmentLineController : ControllerBase
    {
        private readonly IMediator mediator;

        public ItemFulfilmentLineController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ItemFulfilmentLineResultDto>> Get([FromQuery] GetAllItemFulfilmentLine request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ItemFulfilmentLineResultDto> Get(Guid id)
        {
            GetItemFulfilmentLine request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreateItemFulfilmentLines request)
        {
            var result = await mediator.Send(request);

            await SyncRelatedSalesOrdersAsync(request.Lines);

            return result;
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateItemFulfilmentLines request)
        {
            var updatedCount = await mediator.Send(request);

            await SyncRelatedSalesOrdersAsync(request.Lines);

            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} item fulfilment line(s) updated successfully" });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteItemFulfilmentLines request)
        {
            var deletedCount = await mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} item fulfilment line(s) deleted successfully" });
        }

        [HttpGet("by-item-fulfilment/{itemFulfilmentId}")]
        public async Task<ActionResult<object>> GetByItemFulfilmentId(Guid itemFulfilmentId)
        {
            try
            {
                // First check if the item fulfilment exists
                var itemFulfilmentQuery = new GetItemFulfilment { Id = itemFulfilmentId };
                var itemFulfilment = await mediator.Send(itemFulfilmentQuery);

                // Then get all item fulfilment lines for this item fulfilment
                var query = new GetAllItemFulfilmentLine { PageSize = 1000 };
                var allLines = await mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.DNID == itemFulfilmentId).ToList();

                return Ok(new
                {
                    ItemFulfilmentExists = itemFulfilment != null,
                    ItemFulfilment = itemFulfilment,
                    TotalItemFulfilmentLines = allLines.TotalItems,
                    LinesForThisItemFulfilment = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpGet("unfulfilled")]
        public async Task<PaginatedList<ItemFulfilmentLineResultDto>> GetUnfulfilled([FromQuery] GetUnfulfilledItemFulfilmentLines request)
        {
            return await mediator.Send(request);
        }

        private async Task SyncRelatedSalesOrdersAsync(IEnumerable<ItemFulfilmentLineCreateDto>? createLines)
        {
            if (createLines == null)
            {
                return;
            }

            var salesOrderLineIds = createLines
                .Where(line => line.SalesOrderLineId.HasValue && line.SalesOrderLineId != Guid.Empty)
                .Select(line => line.SalesOrderLineId!.Value)
                .Distinct()
                .ToList();

            if (salesOrderLineIds.Any())
            {
                await mediator.Send(new SyncSalesOrderFulfillmentQuantities
                {
                    SalesOrderLineIds = salesOrderLineIds
                });
            }

            var fulfilmentIds = createLines
                .Select(line => line.DNID)
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            foreach (var fulfilmentId in fulfilmentIds)
            {
                await mediator.Send(new SyncSalesOrderFulfillmentQuantities
                {
                    ItemFulfilmentId = fulfilmentId
                });
            }
        }

        private async Task SyncRelatedSalesOrdersAsync(IEnumerable<ItemFulfilmentLineUpdateDto>? updateLines)
        {
            if (updateLines == null)
            {
                return;
            }

            var salesOrderLineIds = updateLines
                .Where(line => line.SalesOrderLineId.HasValue && line.SalesOrderLineId != Guid.Empty)
                .Select(line => line.SalesOrderLineId!.Value)
                .Distinct()
                .ToList();

            if (salesOrderLineIds.Any())
            {
                await mediator.Send(new SyncSalesOrderFulfillmentQuantities
                {
                    SalesOrderLineIds = salesOrderLineIds
                });
            }

            var fulfilmentIds = updateLines
                .Where(line => line.DNID.HasValue && line.DNID != Guid.Empty)
                .Select(line => line.DNID!.Value)
                .Distinct()
                .ToList();

            foreach (var fulfilmentId in fulfilmentIds)
            {
                await mediator.Send(new SyncSalesOrderFulfillmentQuantities
                {
                    ItemFulfilmentId = fulfilmentId
                });
            }
        }
    }
}
