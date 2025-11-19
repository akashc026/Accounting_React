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
        public async Task<Guid> Create(CreateItemFulfilmentLine request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateItemFulfilmentLine request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteItemFulfilmentLine request = new() { Id = id };
            await mediator.Send(request);
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
    }
} 