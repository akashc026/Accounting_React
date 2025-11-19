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
    public class GetActiveLocationsHandler : IRequestHandler<GetActiveLocations, List<LocationResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetActiveLocationsHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<LocationResultDto>> Handle(GetActiveLocations request, CancellationToken cancellationToken)
        {
            // Get all active locations (Inactive = false or null) without pagination
            var locations = await _dbContext.Locations
                .Where(x => x.Inactive == false || x.Inactive == null)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return locations.Select(entity => _mapper.Map<LocationResultDto>(entity)).ToList();
        }
    }
}
