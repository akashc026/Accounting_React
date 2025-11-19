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
    public class GetLatestItemReceiptsHandler : IRequestHandler<GetLatestItemReceipts, IEnumerable<ItemReceiptResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetLatestItemReceiptsHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ItemReceiptResultDto>> Handle(GetLatestItemReceipts request, CancellationToken cancellationToken)
        {
            var query = _dbContext.ItemReceipts
                .Include(x => x.Vendor)
                .Include(x => x.PO)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .OrderByDescending(x => x.ReceiptDate)
                .Take(request.Count);

            var itemReceipts = await query.ToListAsync(cancellationToken);
            return _mapper.Map<IEnumerable<ItemReceiptResultDto>>(itemReceipts);
        }
    }
} 
