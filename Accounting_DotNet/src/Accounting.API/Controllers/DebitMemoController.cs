using Accounting.API.Contracts;
using Accounting.API.Services;
using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("debit-memo")]
    public class DebitMemoController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IJournalGenerationService _journalGenerationService;
        private readonly DebitMemoMergeService _mergeService;

        public DebitMemoController(IMediator mediator, IJournalGenerationService journalGenerationService, DebitMemoMergeService mergeService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
            _mergeService = mergeService;
        }

        [HttpGet]
        public async Task<PaginatedList<DebitMemoResultDto>> Get([FromQuery] GetAllDebitMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<DebitMemoResultDto>> Get(Guid id)
        {
            try
            {
                GetDebitMemo request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"DebitMemo with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving DebitMemo: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateDebitMemo request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateDebitMemo request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteDebitMemo request = new() { Id = id };
            await _mediator.Send(request);

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "DebitMemo",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }

        [HttpGet("by-cust-loc/{customerId:guid}/{locationId:guid}")]
        public async Task<List<DebitMemoResultDto>> GetByCustLoc(Guid customerId, Guid locationId)
        {
            GetDebitMemosByCustLoc request = new()
            {
                CustomerId = customerId,
                LocationId = locationId
            };
            return await _mediator.Send(request);
        }

        [HttpPost("merge")]
        public Task<ActionResult<Guid>> Merge([FromBody] DebitMemoMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: false);
        }

        [HttpPut("merge")]
        public Task<ActionResult<Guid>> MergeUpdate([FromBody] DebitMemoMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: true);
        }

        private async Task<ActionResult<Guid>> HandleMergeAsync(DebitMemoMergeRequest request, bool isUpdateRequest)
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
