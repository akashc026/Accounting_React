using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IMediator mediator;

        public ProductController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<List<ProductResultDto>> Get([FromQuery] GetAllProduct request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ProductResultDto> Get(Guid id)
        {
            GetProduct request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }


        [HttpPost]
        public async Task<Guid> Create(CreateProduct request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateProduct request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteProduct request = new() { Id = id };
            await mediator.Send(request);
        }

        [HttpGet("item-type/{itemTypeId:guid}")]
        public async Task<IEnumerable<ProductResultDto>> GetByItemType(Guid itemTypeId, [FromQuery] GetProductsByItemType request)
        {
            request.ItemTypeId = itemTypeId;
            return await mediator.Send(request);
        }

        [HttpGet("active")]
        public async Task<List<ProductResultDto>> GetActive()
        {
            GetActiveProducts request = new();
            return await mediator.Send(request);
        }
    }
} 