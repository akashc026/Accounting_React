using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class DeleteCustomFieldValues : IRequest<int>
    {
        public List<Guid> Ids { get; set; } = new();
    }
}
