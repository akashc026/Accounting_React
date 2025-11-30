using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("customer-payment")]
    public class CustomerPaymentController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalGenerationService;

        public CustomerPaymentController(IMediator mediator, IJournalGenerationService journalGenerationService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
        }

        [HttpGet]
        public async Task<PaginatedList<CustomerPaymentResultDto>> Get([FromQuery] GetAllCustomerPayment request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CustomerPaymentResultDto>> Get(Guid id)
        {
            try
            {
                GetCustomerPayment request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"CustomerPayment with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CustomerPayment: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateCustomerPayment request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateCustomerPayment request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteCustomerPayment request = new() { Id = id };
            await _mediator.Send(request);

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "CustomerPayment",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }
    }
}
