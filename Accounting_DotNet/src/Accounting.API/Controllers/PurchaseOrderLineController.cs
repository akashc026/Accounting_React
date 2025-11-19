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
    [Route("purchase-order-line")]
    public class PurchaseOrderLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PurchaseOrderLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<PurchaseOrderLineResultDto>> Get([FromQuery] GetAllPurchaseOrderLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PurchaseOrderLineResultDto>> Get(Guid id)
        {
            try
            {
                GetPurchaseOrderLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"PurchaseOrderLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving PurchaseOrderLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreatePurchaseOrderLines request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdatePurchaseOrderLines request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} purchase order line(s) updated successfully" });
        }

        [HttpGet("by-purchase-order/{purchaseOrderId}")]
        public async Task<ActionResult<object>> GetByPurchaseOrderId(Guid purchaseOrderId)
        {
            try
            {
                // First check if the purchase order exists
                var purchaseOrderQuery = new GetPurchaseOrder { Id = purchaseOrderId };
                var purchaseOrder = await _mediator.Send(purchaseOrderQuery);
                
                // Then get all purchase order lines for this purchase order
                var query = new GetAllPurchaseOrderLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.POID == purchaseOrderId).ToList();
                
                return Ok(new 
                {
                    PurchaseOrderExists = purchaseOrder != null,
                    PurchaseOrder = purchaseOrder,
                    TotalPurchaseOrderLines = allLines.TotalItems,
                    LinesForThisPurchaseOrder = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeletePurchaseOrderLines request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} purchase order line(s) deleted successfully" });
        }

        [HttpGet("unreceived")]
        public async Task<ActionResult<PaginatedList<PurchaseOrderLineResultDto>>> GetUnreceived([FromQuery] GetUnreceivedPurchaseOrderLines request)
        {
            var result = await _mediator.Send(request);
            return Ok(result);
        }
    }
} 
