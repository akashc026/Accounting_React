using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ProductStockController : ControllerBase
    {
        private readonly IMediator mediator;

        public ProductStockController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ProductStockResultDto>> Get([FromQuery] GetAllProductStock request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ProductStockResultDto> Get(Guid id)
        {
            GetProductStock request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateProductStock request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateProductStock request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteProductStock request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 