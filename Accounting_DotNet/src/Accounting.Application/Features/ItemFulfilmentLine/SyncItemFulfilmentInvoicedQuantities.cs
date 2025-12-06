using MediatR;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class SyncItemFulfilmentInvoicedQuantities : IRequest<Unit>
    {
        public List<Guid> ItemFulfilmentLineIds { get; set; } = new();

        public Guid? InvoiceId { get; set; }
    }
}
