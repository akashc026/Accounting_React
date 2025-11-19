using MediatR;

namespace Accounting.Application.Features
{
    public class GetDebitMemosByCustLoc : IRequest<List<DebitMemoResultDto>>
    {
        public Guid CustomerId { get; set; }
        public Guid LocationId { get; set; }
    }
}
