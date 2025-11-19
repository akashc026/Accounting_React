using MediatR;

namespace Accounting.Application.Features
{
    public class GetCreditMemosByCustomer : IRequest<List<CreditMemoResultDto>>
    {
        public Guid CustomerId { get; set; }
    }
}
