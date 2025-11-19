using MediatR;
using System;

namespace Accounting.Application.Features
{
    public class GetDefaultFormId : IRequest<Guid?>
    {
        public Guid TypeOfRecord { get; set; }
    }
}
