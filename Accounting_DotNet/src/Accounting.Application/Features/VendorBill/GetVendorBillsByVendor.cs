using MediatR;

namespace Accounting.Application.Features
{
    public class GetVendorBillsByVendorLoc : IRequest<List<VendorBillResultDto>>
    {
        public Guid VendorId { get; set; }
        public Guid LocationId { get; set; }
    }
}
