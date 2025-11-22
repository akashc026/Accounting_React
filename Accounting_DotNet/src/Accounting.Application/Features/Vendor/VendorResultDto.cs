using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class VendorResultDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public string? Address { get; set; }

        public bool? Inactive { get; set; }

        public string? Notes { get; set; }

        public Guid? Form { get; set; }

        public string? SequenceNumber { get; set; }

        public string? FormName { get; set; }



        public DateTime CreatedDate { get; set; }

        public string CreatedBy { get; set; } = null!;

    }





}
