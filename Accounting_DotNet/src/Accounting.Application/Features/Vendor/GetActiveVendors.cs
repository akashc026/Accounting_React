using MediatR;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetActiveVendors : IRequest<List<VendorResultDto>>
    {
    }
}
