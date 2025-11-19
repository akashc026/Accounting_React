using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ItemTypeController : ControllerBase
    {
        private readonly IMediator mediator;

        public ItemTypeController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ItemTypeResultDto>> Get([FromQuery] GetAllItemType request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ItemTypeResultDto> Get(Guid id)
        {
            GetItemType request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }
    }
} 