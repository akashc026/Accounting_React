using MediatR;

namespace Accounting.Application.Features
{
    public class GetVendorCreditsByVendor : IRequest<List<VendorCreditResultDto>>
    {
        public Guid VendorId { get; set; }
    }
}
