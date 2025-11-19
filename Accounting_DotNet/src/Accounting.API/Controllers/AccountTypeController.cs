using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AccountTypeController : ControllerBase
    {
        private readonly IMediator mediator;

        public AccountTypeController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<List<AccountTypeResultDto>> Get([FromQuery] GetAllAccountType request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<AccountTypeResultDto> Get(Guid id)
        {
            GetAccountType request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpGet("by-name/{name}")]
        public async Task<AccountTypeResultDto?> GetByName(string name)
        {
            GetAccountTypeByName request = new() { Name = name };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateAccountType request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateAccountType request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteAccountType request = new() { Id = id };
            await mediator.Send(request);
        }
    }
} 
