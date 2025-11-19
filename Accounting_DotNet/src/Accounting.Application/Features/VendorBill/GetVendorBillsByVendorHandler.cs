using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetVendorBillsByVendorLocHandler : IRequestHandler<GetVendorBillsByVendorLoc, List<VendorBillResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetVendorBillsByVendorLocHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<VendorBillResultDto>> Handle(GetVendorBillsByVendorLoc request, CancellationToken cancellationToken)
        {
            var query = _dbContext.VendorBills
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Include(x => x.StatusNavigation)
                .Where(x => x.VendorID == request.VendorId)
                .Where(x => x.LocationID == request.LocationId)
                .Where(x => x.StatusNavigation != null && x.StatusNavigation.Name == "Open");

            var vendorBills = await query.ToListAsync(cancellationToken);

            return vendorBills.Select(entity => {
                var result = _mapper.Map<VendorBillResultDto>(entity);
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();
        }
    }
}
