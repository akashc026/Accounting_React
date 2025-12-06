using Accounting.API.Contracts;
using Accounting.API.Services;
using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("sales-order")]
    public class SalesOrderController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly SalesOrderMergeService _mergeService;

        public SalesOrderController(IMediator mediator, SalesOrderMergeService mergeService)
        {
            _mediator = mediator;
            _mergeService = mergeService;
        }

        [HttpGet]
        public async Task<PaginatedList<SalesOrderResultDto>> Get([FromQuery] GetAllSalesOrder request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<SalesOrderResultDto>> Get(Guid id)
        {
            try
            {
                GetSalesOrder request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"SalesOrder with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving SalesOrder: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateSalesOrder request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateSalesOrder request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpGet("latest")] 
        public async Task<ActionResult<IEnumerable<SalesOrderResultDto>>> GetLatest([FromQuery] GetLatestSalesOrders query) 
        { var result = await _mediator.Send(query); 
            return Ok(result); 
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteSalesOrder request = new() { Id = id };
            await _mediator.Send(request);
        }

        [HttpPost("merge")]
        public Task<ActionResult<Guid>> Merge([FromBody] SalesOrderMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: false);
        }

        [HttpPut("merge")]
        public Task<ActionResult<Guid>> MergeUpdate([FromBody] SalesOrderMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: true);
        }

        private async Task<ActionResult<Guid>> HandleMergeAsync(SalesOrderMergeRequest request, bool isUpdateRequest)
        {
            try
            {
                var id = await _mergeService.MergeAsync(request, isUpdateRequest);
                return Ok(id);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
