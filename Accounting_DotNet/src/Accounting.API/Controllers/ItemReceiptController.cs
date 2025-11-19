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
    [Route("item-receipt")]
    public class ItemReceiptController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ItemReceiptController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<ItemReceiptResultDto>> Get([FromQuery] GetAllItemReceipt request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ItemReceiptResultDto>> Get(Guid id)
        {
            try
            {
                GetItemReceipt request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"ItemReceipt with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving ItemReceipt: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateItemReceipt request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateItemReceipt request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpGet("latest")] 
        public async Task<ActionResult<IEnumerable<ItemReceiptResultDto>>> GetLatest([FromQuery] GetLatestItemReceipts query) 
        { var result = await _mediator.Send(query); 
            return Ok(result); 
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteItemReceipt request = new() { Id = id };
            await _mediator.Send(request);
        }
    }
} 
