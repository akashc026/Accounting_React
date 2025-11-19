using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetLatestPurchaseOrders : IGetEntities<IEnumerable<PurchaseOrderResultDto>>
    {
        public int Count { get; set; } = 5;
    }
} 
