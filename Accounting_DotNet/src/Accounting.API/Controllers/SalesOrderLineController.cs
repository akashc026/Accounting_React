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
    [Route("salesorderline")]
    public class SalesOrderLineController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SalesOrderLineController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create([FromBody] CreateSalesOrderLine command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Guid>> Update(Guid id, [FromBody] UpdateSalesOrderLine command)
        {
            command.Id = id;
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SalesOrderLineResultDto>> Get(Guid id)
        {
            var query = new GetSalesOrderLine { Id = id };
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedList<SalesOrderLineResultDto>>> GetAll([FromQuery] GetAllSalesOrderLine query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("by-salesorder/{salesOrderId}")]
        public async Task<ActionResult<object>> GetBySalesOrderId(Guid salesOrderId)
        {
            try
            {
                // First check if the sales order exists
                var salesOrderQuery = new GetSalesOrder { Id = salesOrderId };
                var salesOrder = await _mediator.Send(salesOrderQuery);
                
                // Then get all sales order lines for this sales order
                var query = new GetAllSalesOrderLine { PageSize = 1000 };
                var allLines = await _mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.SOID == salesOrderId).ToList();
                
                return Ok(new 
                {
                    SalesOrderExists = salesOrder != null,
                    SalesOrder = salesOrder,
                    TotalSalesOrderLines = allLines.TotalItems,
                    LinesForThisSalesOrder = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var command = new DeleteSalesOrderLine { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }

        [HttpGet("unfulfilled")]
        public async Task<ActionResult<PaginatedList<SalesOrderLineResultDto>>> GetUnfulfilled([FromQuery] GetUnfulfilledSalesOrderLines request)
        {
            var result = await _mediator.Send(request);
            return Ok(result);
        }
    }
}