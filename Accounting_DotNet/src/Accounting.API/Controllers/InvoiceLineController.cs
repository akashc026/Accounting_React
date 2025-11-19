using Accounting.Application.Features;
using ExcentOne.Application.Features.Results;
using MediatR;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class InvoiceLineController : ControllerBase
    {
        private readonly IMediator mediator;

        public InvoiceLineController(IMediator mediator)
        {
            this.mediator = mediator;
        }

        [HttpGet]
        public async Task<PaginatedList<InvoiceLineResultDto>> Get([FromQuery] GetAllInvoiceLine request)
        {
            return await mediator.Send(request);
        }

        [HttpGet("{id:guid}")]
        public async Task<InvoiceLineResultDto> Get(Guid id)
        {
            GetInvoiceLine request = new() { Id = id };
            var result = await mediator.Send(request);
            return result;
        }

        [HttpPost]
        public async Task<Guid> Create(CreateInvoiceLine request)
        {
            return await mediator.Send(request);
        }

        [HttpPut("{id:guid}")]
        public async Task<Guid> Update(Guid id, UpdateInvoiceLine request)
        {
            request.Id = id;
            return await mediator.Send(request);
        }

        [HttpDelete("{id:guid}")]
        public async Task Delete(Guid id)
        {
            DeleteInvoiceLine request = new() { Id = id };
            await mediator.Send(request);
        }

        [HttpGet("by-invoice/{invoiceId}")]
        public async Task<ActionResult<object>> GetByInvoiceId(Guid invoiceId)
        {
            try
            {
                // First check if the invoice exists
                var invoiceQuery = new GetInvoice { Id = invoiceId };
                var invoice = await mediator.Send(invoiceQuery);

                // Then get all invoice lines for this invoice
                var query = new GetAllInvoiceLine { PageSize = 1000 };
                var allLines = await mediator.Send(query);
                var filteredLines = allLines.Results.Where(x => x.INID == invoiceId).ToList();

                return Ok(new
                {
                    InvoiceExists = invoice != null,
                    Invoice = invoice,
                    TotalInvoiceLines = allLines.TotalItems,
                    LinesForThisInvoice = filteredLines.Count,
                    Lines = filteredLines
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }
    }
} 