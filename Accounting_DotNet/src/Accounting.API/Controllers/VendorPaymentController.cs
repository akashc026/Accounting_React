using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("vendor-payment")]
    public class VendorPaymentController : ControllerBase
    {
        private readonly IJournalGenerationService _journalGenerationService;
        private readonly IMediator _mediator;

        public VendorPaymentController(IMediator mediator, IJournalGenerationService journalGenerationService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
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

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "VendorPayment",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }
    }
}
