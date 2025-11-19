using ExcentOne.MediatR.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetStandardFieldsByRecordType : IDbQuery<List<StandardFieldResultDto>>
    {
        public Guid RecordTypeId { get; set; }
    }
} 