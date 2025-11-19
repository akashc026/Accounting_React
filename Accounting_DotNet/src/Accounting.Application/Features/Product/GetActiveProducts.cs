using MediatR;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetActiveProducts : IRequest<List<ProductResultDto>>
    {
    }
}
