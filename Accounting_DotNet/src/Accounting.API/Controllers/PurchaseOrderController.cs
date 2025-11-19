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
    [Route("purchase-order")]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PurchaseOrderController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<PurchaseOrderResultDto>> Get([FromQuery] GetAllPurchaseOrder request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PurchaseOrderResultDto>> Get(Guid id)
        {
            try
            {
                GetPurchaseOrder request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"PurchaseOrder with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving PurchaseOrder: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreatePurchaseOrder request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdatePurchaseOrder request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpGet("latest")] 
        public async Task<ActionResult<IEnumerable<PurchaseOrderResultDto>>> GetLatest([FromQuery] GetLatestPurchaseOrders query) 
        { var result = await _mediator.Send(query); 
            return Ok(result); 
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeletePurchaseOrder request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
} 
