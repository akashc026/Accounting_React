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
    [Route("vendor-payment")]
    public class VendorPaymentController : ControllerBase
    {
        private readonly IMediator _mediator;

        public VendorPaymentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorPaymentResultDto>> Get([FromQuery] GetAllVendorPayment request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorPaymentResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorPayment request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorPayment with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorPayment: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateVendorPayment request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateVendorPayment request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteVendorPayment request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
}
