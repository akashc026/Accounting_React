using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ItemFulfilmentController : ControllerBase
    {
        private readonly IMediator mediator;

        public ItemFulfilmentController(IMediator mediator)
        {
            this.mediator = mediator;
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
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteItemFulfilment request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 