using Accounting.Persistence;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetVendorPaymentLinesByRecordIdHandler : IRequestHandler<GetVendorPaymentLinesByRecordId, IEnumerable<VendorPaymentLineResultDto>>
    {
        private readonly AccountingDbContext _context;

        public GetVendorPaymentLinesByRecordIdHandler(AccountingDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<VendorPaymentLineResultDto>> Handle(GetVendorPaymentLinesByRecordId request, CancellationToken cancellationToken)
        {
            var vendorPaymentLines = await _context.VendorPaymentLines
                .Where(x => x.RecordID == request.RecordID)
                .ToListAsync(cancellationToken);

            return vendorPaymentLines.Adapt<IEnumerable<VendorPaymentLineResultDto>>();
        }
    }
}
