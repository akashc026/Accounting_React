using Accounting.Application.Features;
using Accounting.Application.Services;
using ExcentOne.Application.Features.Results;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [ApiController]
    [Route("vendor-bill")]
    public class VendorBillController : ControllerBase
    {
        private readonly IJournalGenerationService _journalGenerationService;
        private readonly IMediator _mediator;

        public VendorBillController(IMediator mediator, IJournalGenerationService journalGenerationService)
        {
            _mediator = mediator;
            _journalGenerationService = journalGenerationService;
        }

        [HttpGet]
        public async Task<PaginatedList<VendorBillResultDto>> Get([FromQuery] GetAllVendorBill request)
        {
            return await _mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<VendorBillResultDto>> Get(Guid id)
        {
            try
            {
                GetVendorBill request = new() { Id = id };
                var result = await _mediator.Send(request);
                
                if (result == null)
                {
                    return NotFound($"VendorBill with ID {id} not found");
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error retrieving VendorBill: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<Guid> Create(CreateVendorBill request)
        {
            return await _mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateVendorBill request)
        {
            request.Id = id;
            return await _mediator.Send(request);
        }

        [HttpGet("latest")] 
        public async Task<ActionResult<IEnumerable<VendorBillResultDto>>> GetLatest([FromQuery] GetLatestVendorBills query) 
        { var result = await _mediator.Send(query); 
            return Ok(result); 
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteVendorBill request = new() { Id = id };
            await _mediator.Send(request);

            await _journalGenerationService.ProcessAsync(new GenerateJvRequest
            {
                RecordType = "VendorBill",
                OperationType = "delete",
                RecordId = id.ToString()
            });
        }

        [HttpGet("by-vendor-loc/{vendorId:guid}/{locationId:guid}")]
        public async Task<List<VendorBillResultDto>> GetByVendorLoc(Guid vendorId, Guid locationId)
        {
            GetVendorBillsByVendorLoc request = new()
            {
                VendorId = vendorId,
                LocationId = locationId
            };
            return await _mediator.Send(request);
        }
    }
} 
