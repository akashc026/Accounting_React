using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly IMediator mediator;

        public CustomerController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CustomerResultDto>> Get([FromQuery] GetAllCustomer request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<CustomerResultDto> Get(Guid id)
        {
            GetCustomer request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCustomer request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCustomer request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }


        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCustomer request = new() { Id = id };
            await mediator.Send(request);
        }

        [HttpGet("active")]
        public async Task<List<CustomerResultDto>> GetActive()
        {
            GetActiveCustomers request = new();
            return await mediator.Send(request);
        }
    }
}
