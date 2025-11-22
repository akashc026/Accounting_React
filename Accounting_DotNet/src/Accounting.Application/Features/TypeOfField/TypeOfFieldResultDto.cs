using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class TypeOfFieldResultDto
    {
        public Guid Id { get; set; }

        public string ComponentName { get; set; } = null!;

        public string PackageName { get; set; } = null!;

        public string Category { get; set; } = null!;

        public string? Description { get; set; }

        public int StandardFieldsCount { get; set; }


        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





} 
