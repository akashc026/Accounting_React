using MediatR;
using System;

namespace Accounting.Application.Features
{
    public class UpdateFormIsDefault : IRequest<Guid>
    {
        public Guid Id { get; set; }
        public bool IsDefault { get; set; }
    }
}
