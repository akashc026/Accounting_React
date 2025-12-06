using Accounting.API.Contracts;
using Accounting.API.Services;
using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IMediator mediator;
        private readonly IJournalGenerationService journalGenerationService;
        private readonly InvoiceMergeService _mergeService;

        public InvoiceController(IMediator mediator, IJournalGenerationService journalGenerationService, InvoiceMergeService mergeService)
        {
            this.mediator = mediator;
            this.journalGenerationService = journalGenerationService;
            _mergeService = mergeService;
        }

        [HttpGet]
        public async Task<PaginatedList<InvoiceResultDto>> Get([FromQuery] GetAllInvoice request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<InvoiceResultDto> Get(Guid id)
        {
            GetInvoice request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateInvoice request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInvoice request)
        {
            request.Id = id;
            var result = await mediator.Send(request);

            await mediator.Send(new SyncItemFulfilmentInvoicedQuantities
            {
                InvoiceId = id
            });

            return result;
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteInvoice request = new() { Id = id };
            await mediator.Send(request);

            await journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "Invoice",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }

        [HttpGet("by-cust-loc/{customerId:guid}/{locationId:guid}")]
        public async Task<List<InvoiceResultDto>> GetByCustLoc(Guid customerId, Guid locationId)
        {
            GetInvoicesByCustLoc request = new()
            {
                CustomerId = customerId,
                LocationId = locationId
            };
            return await mediator.Send(request);
        }

        [HttpPost("merge")]
        public Task<ActionResult<Guid>> Merge([FromBody] InvoiceMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: false);
        }

        [HttpPut("merge")]
        public Task<ActionResult<Guid>> MergeUpdate([FromBody] InvoiceMergeRequest request)
        {
            return HandleMergeAsync(request, isUpdateRequest: true);
        }

        private async Task<ActionResult<Guid>> HandleMergeAsync(InvoiceMergeRequest request, bool isUpdateRequest)
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
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

    }
}
