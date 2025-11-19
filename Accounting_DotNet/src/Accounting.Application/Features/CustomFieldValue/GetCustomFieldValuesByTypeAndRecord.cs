using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetCustomFieldValuesByTypeAndRecord : IRequest<List<CustomFieldValueResultDto>>
    {
        public Guid TypeOfRecord { get; set; }
        
        public string? RecordID { get; set; }
    }
} 