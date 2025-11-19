using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ChartOfAccountController : ControllerBase
    {
        private readonly IMediator mediator;

        public ChartOfAccountController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ChartOfAccountResultDto>> Get([FromQuery] GetAllChartOfAccount request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("by-parent-number/{parentNumber}")]
        public async Task<List<ChartOfAccountResultDto>> GetByParentNumber(string parentNumber)
        {
            GetChartOfAccountsByParentNumber request = new() { ParentNumber = parentNumber };
            return await mediator.Send(request);
        }

        [HttpGet("by-account-type/{accountTypeId:guid}")]
        public async Task<List<ChartOfAccountResultDto>> GetByAccountType(Guid accountTypeId)
        {
            GetChartOfAccountsByAccountType request = new() { AccountTypeId = accountTypeId };
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ChartOfAccountResultDto> Get(Guid id)
        {
            GetChartOfAccount request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateChartOfAccount request)
        {
            return await mediator.Send(request);
        }

        [HttpPost("balances")]
        public async Task<List<ChartOfAccountBalanceDto>> GetBalances(GetChartOfAccountsBalances request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateChartOfAccount request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpPut("bulk")]
        public async Task<IActionResult> UpdateBulk(UpdateChartOfAccountsBulk request)
        {
            var updatedCount = await mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} chart of account(s) updated successfully" });
        }

        [HttpGet("check-account-number-exists")]
        public async Task<bool> CheckAccountNumberExists([FromQuery] string accountNumber)
        {
            CheckAccountNumberExists request = new() { AccountNumber = accountNumber };
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteChartOfAccount request = new() { Id = id };
            await mediator.Send(request);
        }
    }
}
