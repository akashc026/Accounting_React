using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IMediator mediator;

        public InvoiceController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<InvoiceResultDto>> Get([FromQuery] GetAllInvoice request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<InvoiceResultDto> Get(Guid id)
        {
            GetInvoice request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateInvoice request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInvoice request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteInvoice request = new() { Id = id };
            await mediator.Send(request);
        }

        [HttpGet("by-cust-loc/{customerId:guid}/{locationId:guid}")]
        public async Task<List<InvoiceResultDto>> GetByCustLoc(Guid customerId, Guid locationId)
        {
            GetInvoicesByCustLoc request = new()
            {
                CustomerId = customerId,
                LocationId = locationId
            };
            return await mediator.Send(request);
        }
    }
}