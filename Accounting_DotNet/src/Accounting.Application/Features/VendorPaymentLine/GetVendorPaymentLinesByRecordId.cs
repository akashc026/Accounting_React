using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetVendorPaymentLinesByRecordId : IRequest<IEnumerable<VendorPaymentLineResultDto>>
    {
        public string RecordID { get; set; } = null!;
    }
}
