using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetLatestVendorBillsHandler : IRequestHandler<GetLatestVendorBills, IEnumerable<VendorBillResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetLatestVendorBillsHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<IEnumerable<VendorBillResultDto>> Handle(GetLatestVendorBills request, CancellationToken cancellationToken)
        {
            var query = _dbContext.VendorBills
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .OrderByDescending(x => x.InvoiceDate)
                .Take(request.Count);

            var vendorBills = await query.ToListAsync(cancellationToken);
            return _mapper.Map<IEnumerable<VendorBillResultDto>>(vendorBills);
        }
    }
} 
