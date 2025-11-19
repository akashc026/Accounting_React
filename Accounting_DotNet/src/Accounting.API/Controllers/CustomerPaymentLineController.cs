using Accounting.Application.Features;
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
    [Route("customer-payment-line")]
    public class CustomerPaymentLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CustomerPaymentLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<CustomerPaymentLineResultDto>> Get([FromQuery] GetAllCustomerPaymentLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CustomerPaymentLineResultDto>> Get(Guid id)
        {
            try
            {
                GetCustomerPaymentLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"CustomerPaymentLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CustomerPaymentLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] CreateCustomerPaymentLine request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating CustomerPaymentLine: {ex.Message}");
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<Guid>> Update(Guid id, [FromBody] UpdateCustomerPaymentLine request)
        {
            try
            {
                request.Id = id;
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating CustomerPaymentLine: {ex.Message}");
            }
        }

        [HttpGet("by-customer-payment/{customerPaymentId}")]
        public async Task<ActionResult<object>> GetByCustomerPaymentId(Guid customerPaymentId)
        {
            try
            {
                // First check if the customer payment exists
                var customerPaymentQuery = new GetCustomerPayment { Id = customerPaymentId };
                var customerPayment = await _mediator.Send(customerPaymentQuery);

                // Then get all customer payment lines for this customer payment
                var query = new GetAllCustomerPaymentLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.PaymentId == customerPaymentId).ToList();

                return Ok(new
                {
                    CustomerPaymentExists = customerPayment != null,
                    CustomerPayment = customerPayment,
                    TotalCustomerPaymentLines = allLines.TotalItems,
                    LinesForThisCustomerPayment = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                DeleteCustomerPaymentLine request = new() { Id = id };
                await _mediator.Send(request);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting CustomerPaymentLine: {ex.Message}");
            }
        }

        [HttpGet("by-record-id/{recordId}")]
        public async Task<ActionResult<IEnumerable<CustomerPaymentLineResultDto>>> GetByRecordId(string recordId)
        {
            try
            {
                var request = new GetCustomerPaymentLinesByRecordId { RecordID = recordId };
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving CustomerPaymentLines by RecordID: {ex.Message}");
            }
        }

   
    }
}
