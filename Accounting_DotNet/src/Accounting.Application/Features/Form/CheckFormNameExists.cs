using MediatR;
using System;

namespace Accounting.Application.Features
{
    public class CheckFormNameExists : IRequest<bool>
    {
        public string FormName { get; set; } = null!;
        public Guid TypeOfRecord { get; set; }
    }
}
