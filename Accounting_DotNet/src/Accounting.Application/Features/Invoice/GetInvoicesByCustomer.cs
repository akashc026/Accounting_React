using MediatR;

namespace Accounting.Application.Features
{
    public class GetInvoicesByCustLoc : IRequest<List<InvoiceResultDto>>
    {
        public Guid CustomerId { get; set; }
        public Guid LocationId { get; set; }
    }
}
