using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetLatestVendorBills : IGetEntities<IEnumerable<VendorBillResultDto>>
    {
        public int Count { get; set; } = 5;
    }
} 
