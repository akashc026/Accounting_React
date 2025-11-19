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
    [Route("vendor-bill-line")]
    public class VendorBillLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorBillLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorBillLineResultDto>> Get([FromQuery] GetAllVendorBillLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorBillLineResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorBillLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorBillLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorBillLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreateVendorBillLines request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateVendorBillLines request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} vendor bill line(s) updated successfully" });
        }

        [HttpGet("by-vendor-bill/{vendorBillId}")]
        public async Task<ActionResult<object>> GetByVendorBillId(Guid vendorBillId)
        {
            try
            {
                // First check if the vendor bill exists
                var vendorBillQuery = new GetVendorBill { Id = vendorBillId };
                var vendorBill = await _mediator.Send(vendorBillQuery);
                
                // Then get all vendor bill lines for this vendor bill
                var query = new GetAllVendorBillLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.VBID == vendorBillId).ToList();
                
                return Ok(new 
                {
                    VendorBillExists = vendorBill != null,
                    VendorBill = vendorBill,
                    TotalVendorBillLines = allLines.TotalItems,
                    LinesForThisVendorBill = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteVendorBillLines request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} vendor bill line(s) deleted successfully" });
        }
    }
} 
