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
    [Route("vendor-credit-line")]
    public class VendorCreditLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorCreditLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorCreditLineResultDto>> Get([FromQuery] GetAllVendorCreditLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorCreditLineResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorCreditLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorCreditLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorCreditLine: {ex.Message}");
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

                // Then get all vendor credit lines for this vendor credit
                var query = new GetAllVendorCreditLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.VCID == vendorCreditId).ToList();

                return Ok(new
                {
                    VendorCreditExists = vendorCredit != null,
                    VendorCredit = vendorCredit,
                    TotalVendorCreditLines = allLines.TotalItems,
                    LinesForThisVendorCredit = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateVendorCreditLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateVendorCreditLine request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteVendorCreditLine request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
}
