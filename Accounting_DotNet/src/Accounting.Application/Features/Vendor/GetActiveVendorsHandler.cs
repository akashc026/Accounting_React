using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetActiveVendorsHandler : IRequestHandler<GetActiveVendors, List<VendorResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetActiveVendorsHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<VendorResultDto>> Handle(GetActiveVendors request, CancellationToken cancellationToken)
        {
            // Get all active vendors (Inactive = false or null) without pagination
            var vendors = await _dbContext.Vendors
                .Include(x => x.FormNavigation)
                .Where(x => x.Inactive == false || x.Inactive == null)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return vendors.Select(entity => {
                var result = _mapper.Map<VendorResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();
        }
    }
}
