using MediatR;
using System;

namespace Accounting.Application.Features
{
    public class CheckFormPrefixExists : IRequest<bool>
    {
        public string Prefix { get; set; } = null!;
        public Guid TypeOfRecord { get; set; }
    }
}
