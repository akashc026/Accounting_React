using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetVendorCreditsByVendorHandler : IRequestHandler<GetVendorCreditsByVendor, List<VendorCreditResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetVendorCreditsByVendorHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<VendorCreditResultDto>> Handle(GetVendorCreditsByVendor request, CancellationToken cancellationToken)
        {
            var vendorCredits = await _dbContext.VendorCredits
                .Include(x => x.Vendor)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Where(x => x.VendorID == request.VendorId)
                .ToListAsync(cancellationToken);

            return vendorCredits.Select(entity => {
                var result = _mapper.Map<VendorCreditResultDto>(entity);
                result.VendorName = entity.Vendor?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();
        }
    }
}
