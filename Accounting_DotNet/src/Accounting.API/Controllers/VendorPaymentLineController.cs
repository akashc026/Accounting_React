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
    [Route("vendor-payment-line")]
    public class VendorPaymentLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorPaymentLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorPaymentLineResultDto>> Get([FromQuery] GetAllVendorPaymentLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorPaymentLineResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorPaymentLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorPaymentLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorPaymentLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] CreateVendorPaymentLine request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating VendorPaymentLine: {ex.Message}");
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<Guid>> Update(Guid id, [FromBody] UpdateVendorPaymentLine request)
        {
            try
            {
                request.Id = id;
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error updating VendorPaymentLine: {ex.Message}");
            }
        }

        [HttpGet("by-vendor-payment/{vendorPaymentId}")]
        public async Task<ActionResult<object>> GetByVendorPaymentId(Guid vendorPaymentId)
        {
            try
            {
                // First check if the vendor payment exists
                var vendorPaymentQuery = new GetVendorPayment { Id = vendorPaymentId };
                var vendorPayment = await _mediator.Send(vendorPaymentQuery);

                // Then get all vendor payment lines for this vendor payment
                var query = new GetAllVendorPaymentLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.PaymentId == vendorPaymentId).ToList();

                return Ok(new
                {
                    VendorPaymentExists = vendorPayment != null,
                    VendorPayment = vendorPayment,
                    TotalVendorPaymentLines = allLines.TotalItems,
                    LinesForThisVendorPayment = filteredLines.Count,
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
                DeleteVendorPaymentLine request = new() { Id = id };
                await _mediator.Send(request);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Error deleting VendorPaymentLine: {ex.Message}");
            }
        }

        [HttpGet("by-record-id/{recordId}")]
        public async Task<ActionResult<IEnumerable<VendorPaymentLineResultDto>>> GetByRecordId(string recordId)
        {
            try
            {
                var request = new GetVendorPaymentLinesByRecordId { RecordID = recordId };
                var result = await _mediator.Send(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorPaymentLines by RecordID: {ex.Message}");
            }
        }

    }
}
