using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class SyncSalesOrderFulfillmentQuantities : IRequest<Unit>
    {
        public List<Guid> SalesOrderLineIds { get; set; } = new();

        public Guid? ItemFulfilmentId { get; set; }
    }
}
