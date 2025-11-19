using MediatR;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetActiveCustomers : IRequest<List<CustomerResultDto>>
    {
    }
}
