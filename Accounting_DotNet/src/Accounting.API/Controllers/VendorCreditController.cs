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
    [Route("vendor-credit")]
    public class VendorCreditController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorCreditController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorCreditResultDto>> Get([FromQuery] GetAllVendorCredit request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorCreditResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorCredit request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorCredit with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorCredit: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateVendorCredit request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateVendorCredit request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteVendorCredit request = new() { Id = id };
            await _mediator.Send(request);
        }

        [HttpGet("by-vendor/{vendorId:guid}")]
        public async Task<List<VendorCreditResultDto>> GetByVendor(Guid vendorId)
        {
            GetVendorCreditsByVendor request = new()
            {
                VendorId = vendorId
            };
            return await _mediator.Send(request);
        }
    }
}
