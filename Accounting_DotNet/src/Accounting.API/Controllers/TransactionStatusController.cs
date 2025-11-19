using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class TransactionStatusController : ControllerBase
    {
        private readonly IMediator mediator;

        public TransactionStatusController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<TransactionStatusResultDto>> Get([FromQuery] GetAllTransactionStatus request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<TransactionStatusResultDto> Get(Guid id)
        {
            GetTransactionStatus request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }
    }
} 