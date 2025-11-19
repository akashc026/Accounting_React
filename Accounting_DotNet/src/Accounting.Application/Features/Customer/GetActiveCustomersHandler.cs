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
    public class GetActiveCustomersHandler : IRequestHandler<GetActiveCustomers, List<CustomerResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetActiveCustomersHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<CustomerResultDto>> Handle(GetActiveCustomers request, CancellationToken cancellationToken)
        {
            // Get all active customers (Inactive = false or null) without pagination
            var customers = await _dbContext.Customers
                .Include(x => x.FormNavigation)
                .Where(x => x.Inactive == false || x.Inactive == null)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return customers.Select(entity => {
                var result = _mapper.Map<CustomerResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();
        }
    }
}
