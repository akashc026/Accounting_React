using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetItemFulfilmentLine : IGetEntity<Guid, ItemFulfilmentLineResultDto>
    {
        public Guid Id { get; set; }
    }
} 