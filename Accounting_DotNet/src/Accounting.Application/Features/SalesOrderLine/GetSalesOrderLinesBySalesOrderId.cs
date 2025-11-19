using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetSalesOrderLinesBySalesOrderId : IGetEntities<IEnumerable<SalesOrderLineResultDto>>
    {
        public Guid SalesOrderId { get; set; }
    }
} 