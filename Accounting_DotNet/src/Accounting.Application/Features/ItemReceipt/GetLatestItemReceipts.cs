using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;

namespace Accounting.Application.Features
{
    public class GetLatestItemReceipts : IGetEntities<IEnumerable<ItemReceiptResultDto>>
    {
        public int Count { get; set; } = 5;
    }
} 
