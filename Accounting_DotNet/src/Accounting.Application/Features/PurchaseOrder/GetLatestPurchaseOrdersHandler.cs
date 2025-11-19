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
    public class GetLatestPurchaseOrdersHandler : IRequestHandler<GetLatestPurchaseOrders, IEnumerable<PurchaseOrderResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetLatestPurchaseOrdersHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PurchaseOrderResultDto>> Handle(GetLatestPurchaseOrders request, CancellationToken cancellationToken)
        {
            var query = _dbContext.PurchaseOrders
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .OrderByDescending(x => x.PODate)
                .Take(request.Count);

            var purchaseOrders = await query.ToListAsync(cancellationToken);
            return _mapper.Map<IEnumerable<PurchaseOrderResultDto>>(purchaseOrders);
        }
    }
} 
