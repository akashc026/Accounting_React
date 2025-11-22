using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class TransactionStatusResultDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public Guid TypeOfRecord { get; set; }

        public string? TypeOfRecordName { get; set; }

        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





} 
