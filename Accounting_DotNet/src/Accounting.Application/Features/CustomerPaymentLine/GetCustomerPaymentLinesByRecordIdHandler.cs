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
    public class GetCustomerPaymentLinesByRecordIdHandler : IRequestHandler<GetCustomerPaymentLinesByRecordId, IEnumerable<CustomerPaymentLineResultDto>>
    {
        private readonly AccountingDbContext _context;

        public GetCustomerPaymentLinesByRecordIdHandler(AccountingDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CustomerPaymentLineResultDto>> Handle(GetCustomerPaymentLinesByRecordId request, CancellationToken cancellationToken)
        {
            var customerPaymentLines = await _context.CustomerPaymentLines
                .Where(x => x.RecordID == request.RecordID)
                .ToListAsync(cancellationToken);

            return customerPaymentLines.Adapt<IEnumerable<CustomerPaymentLineResultDto>>();
        }
    }
}
