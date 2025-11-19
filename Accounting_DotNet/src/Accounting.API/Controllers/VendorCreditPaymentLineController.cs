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
    [Route("vendor-credit-payment-line")]
    public class VendorCreditPaymentLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorCreditPaymentLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorCreditPaymentLineResultDto>> Get([FromQuery] GetAllVendorCreditPaymentLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorCreditPaymentLineResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorCreditPaymentLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorCreditPaymentLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorCreditPaymentLine: {ex.Message}");
            }
        }

    [HttpGet("by-payment/{paymentId:guid}")]
    public async Task<ActionResult<PaginatedList<VendorCreditPaymentLineResultDto>>> GetByPaymentId(Guid paymentId)
    {
        try
        {
            var request = new GetAllVendorCreditPaymentLine { SearchText = paymentId.ToString(), PageSize = 1000 };
            var result = await _mediator.Send(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    [HttpGet("by-vendor-credit/{vendorCreditId}")]
    public async Task<ActionResult<object>> GetByVendorCreditId(Guid vendorCreditId)
    {
        try
        {
            // First check if the vendor credit exists
            var vendorCreditQuery = new GetVendorCredit { Id = vendorCreditId };
            var vendorCredit = await _mediator.Send(vendorCreditQuery);

            // Then get all vendor credit payment lines for this vendor credit
            var query = new GetAllVendorCreditPaymentLine { PageSize = 1000 };
            var allLines = await _mediator.Send(query);
            var filteredLines = allLines.Results.Where(x => x.VCID == vendorCreditId).ToList();

            return Ok(new
            {
                VendorCreditExists = vendorCredit != null,
                VendorCredit = vendorCredit,
                TotalVendorCreditPaymentLines = allLines.TotalItems,
                LinesForThisVendorCredit = filteredLines.Count,
                Lines = filteredLines
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    [HttpGet("by-record-id/{recordId}")]
    public async Task<ActionResult<IEnumerable<VendorCreditPaymentLineResultDto>>> GetByRecordId(string recordId)
    {
        try
        {
            var query = new GetAllVendorCreditPaymentLine { PageSize = 1000 };
            var allLines = await _mediator.Send(query);
            var filteredLines = allLines.Results.Where(x => x.RecordID == recordId).ToList();
            return Ok(filteredLines);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error retrieving VendorCreditPaymentLines by RecordID: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<List<Guid>>> Create([FromBody] CreateVendorCreditPaymentLines request)
    {
        try
        {
            var result = await _mediator.Send(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error creating VendorCreditPaymentLines: {ex.Message}");
        }
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateVendorCreditPaymentLines request)
    {
        try
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} vendor credit payment line(s) updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error updating VendorCreditPaymentLines: {ex.Message}");
        }
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] DeleteVendorCreditPaymentLines request)
    {
        try
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} vendor credit payment line(s) deleted successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error deleting VendorCreditPaymentLines: {ex.Message}");
        }
    }
    }
}
