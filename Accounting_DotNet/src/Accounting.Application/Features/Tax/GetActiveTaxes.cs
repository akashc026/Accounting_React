using MediatR;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetActiveTaxes : IRequest<List<TaxResultDto>>
    {
    }
}
