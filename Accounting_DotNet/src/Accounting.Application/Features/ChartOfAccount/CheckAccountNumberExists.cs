using MediatR;

namespace Accounting.Application.Features
{
    public class CheckAccountNumberExists : IRequest<bool>
    {
        public string AccountNumber { get; set; } = null!;
    }
}
