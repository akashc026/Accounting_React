using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetLatestSalesOrders : IGetEntities<IEnumerable<SalesOrderResultDto>>
    {
        public int Count { get; set; } = 10; // Default to latest 10 sales orders
        public Guid? LocationID { get; set; }
    }
} 