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
    [Route("item-receipt-line")]
    public class ItemReceiptLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ItemReceiptLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ItemReceiptLineResultDto>> Get([FromQuery] GetAllItemReceiptLine request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ItemReceiptLineResultDto>> Get(Guid id)
        {
            try
            {
                GetItemReceiptLine request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"ItemReceiptLine with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving ItemReceiptLine: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<List<Guid>> Create(CreateItemReceiptLines request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateItemReceiptLines request)
        {
            var updatedCount = await _mediator.Send(request);
            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} item receipt line(s) updated successfully" });
        }

        [HttpGet("by-item-receipt/{itemReceiptId}")]
        public async Task<ActionResult<object>> GetByItemReceiptId(Guid itemReceiptId)
        {
            try
            {
                // First check if the item receipt exists
                var itemReceiptQuery = new GetItemReceipt { Id = itemReceiptId };
                var itemReceipt = await _mediator.Send(itemReceiptQuery);
                
                // Then get all item receipt lines for this item receipt
                var query = new GetAllItemReceiptLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.IRID == itemReceiptId).ToList();
                
                return Ok(new 
                {
                    ItemReceiptExists = itemReceipt != null,
                    ItemReceipt = itemReceipt,
                    TotalItemReceiptLines = allLines.TotalItems,
                    LinesForThisItemReceipt = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteItemReceiptLines request)
        {
            var deletedCount = await _mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} item receipt line(s) deleted successfully" });
        }

        [HttpGet("uninvoiced")]
        public async Task<ActionResult<PaginatedList<ItemReceiptLineResultDto>>> GetUninvoiced([FromQuery] GetUninvoicedItemReceiptLines request)
        {
            var result = await _mediator.Send(request);
            return Ok(result);
        }
    }
} 
