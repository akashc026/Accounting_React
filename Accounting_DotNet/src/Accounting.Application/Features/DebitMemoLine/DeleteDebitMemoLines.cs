using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class DeleteDebitMemoLines : IRequest<int>
    {
        public List<Guid> Ids { get; set; } = new();
    }
}
