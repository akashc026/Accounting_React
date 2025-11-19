using MediatR;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetActiveLocations : IRequest<List<LocationResultDto>>
    {
    }
}
