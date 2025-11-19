using ExcentOne.MediatR.EntityFrameworkCore.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetRecordTypeByName : IDbQuery<RecordTypeResultDto?>
    {
        public string Name { get; set; } = null!;
    }
} 