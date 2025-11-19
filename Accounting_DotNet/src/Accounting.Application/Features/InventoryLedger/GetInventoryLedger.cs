using ExcentOne.Application.Features.Queries;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetInventoryLedger : IGetEntity<Guid, InventoryLedgerResultDto>
    {
        public Guid Id { get; set; }
    }
} 