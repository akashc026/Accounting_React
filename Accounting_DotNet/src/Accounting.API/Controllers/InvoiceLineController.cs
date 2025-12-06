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
        public async Task<List<Guid>> Create(CreateInvoiceLines request)
        {
            var result = await mediator.Send(request);

            await SyncFulfilmentInvoicedQuantitiesAsync(request.Lines, request.Lines?.FirstOrDefault()?.INID);

            return result;
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateInvoiceLines request)
        {
            var updatedCount = await mediator.Send(request);

            await SyncFulfilmentInvoicedQuantitiesAsync(request.Lines, null);

            return Ok(new { UpdatedCount = updatedCount, Message = $"{updatedCount} invoice line(s) updated successfully" });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(DeleteInvoiceLines request)
        {
            var deletedCount = await mediator.Send(request);
            return Ok(new { DeletedCount = deletedCount, Message = $"{deletedCount} invoice line(s) deleted successfully" });
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

        private async Task SyncFulfilmentInvoicedQuantitiesAsync(IEnumerable<InvoiceLineCreateDto>? lines, Guid? invoiceId)
        {
            if (lines == null)
            {
                return;
            }

            var lineList = lines.ToList();
            if (!lineList.Any() && !invoiceId.HasValue)
            {
                return;
            }

            var fulfilmentLineIds = lineList
                .Where(line => line.ItemFulfillmentLineId.HasValue && line.ItemFulfillmentLineId != Guid.Empty)
                .Select(line => line.ItemFulfillmentLineId!.Value)
                .Distinct()
                .ToList();

            if (!invoiceId.HasValue)
            {
                var firstInvoiceId = lineList
                    .Select(line => line.INID)
                    .FirstOrDefault(id => id != Guid.Empty);

                if (firstInvoiceId != Guid.Empty)
                {
                    invoiceId = firstInvoiceId;
                }
            }

            if (!fulfilmentLineIds.Any() && !invoiceId.HasValue)
            {
                return;
            }

            await mediator.Send(new SyncItemFulfilmentInvoicedQuantities
            {
                ItemFulfilmentLineIds = fulfilmentLineIds,
                InvoiceId = invoiceId
            });
        }

        private async Task SyncFulfilmentInvoicedQuantitiesAsync(IEnumerable<InvoiceLineUpdateDto>? lines, Guid? invoiceId)
        {
            if (lines == null)
            {
                return;
            }

            var lineList = lines.ToList();
            if (!lineList.Any() && !invoiceId.HasValue)
            {
                return;
            }

            var fulfilmentLineIds = lineList
                .Where(line => line.ItemFulfillmentLineId.HasValue && line.ItemFulfillmentLineId != Guid.Empty)
                .Select(line => line.ItemFulfillmentLineId!.Value)
                .ToList();

            var missingMetadataIds = lineList
                .Where(line => !line.ItemFulfillmentLineId.HasValue || line.INID == Guid.Empty)
                .Select(line => line.Id)
                .Distinct()
                .ToList();

            foreach (var lineId in missingMetadataIds)
            {
                var existingLine = await mediator.Send(new GetInvoiceLine { Id = lineId });
                if (existingLine != null)
                {
                    if (!invoiceId.HasValue && existingLine.INID != Guid.Empty)
                    {
                        invoiceId = existingLine.INID;
                    }

                    if (existingLine.ItemFulfillmentLineId.HasValue)
                    {
                        fulfilmentLineIds.Add(existingLine.ItemFulfillmentLineId.Value);
                    }
                }
            }

            if (!invoiceId.HasValue)
            {
                var firstInvoiceId = lineList
                    .Where(line => line.INID.HasValue)
                    .Select(line => line.INID!.Value)
                    .FirstOrDefault();

                if (firstInvoiceId != Guid.Empty)
                {
                    invoiceId = firstInvoiceId;
                }
            }

            fulfilmentLineIds = fulfilmentLineIds
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            if (!fulfilmentLineIds.Any() && !invoiceId.HasValue)
            {
                return;
            }

            await mediator.Send(new SyncItemFulfilmentInvoicedQuantities
            {
                ItemFulfilmentLineIds = fulfilmentLineIds,
                InvoiceId = invoiceId
            });
        }
    }
}
