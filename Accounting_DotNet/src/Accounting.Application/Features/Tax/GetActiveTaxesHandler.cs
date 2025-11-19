using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetActiveTaxesHandler : IRequestHandler<GetActiveTaxes, List<TaxResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetActiveTaxesHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<TaxResultDto>> Handle(GetActiveTaxes request, CancellationToken cancellationToken)
        {
            // Get all active taxes (Inactive = false or null) without pagination
            var taxes = await _dbContext.Taxes
                .Include(x => x.TaxAccountNavigation)
                .Where(x => x.Inactive == false || x.Inactive == null)
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return taxes.Select(entity => {
                var result = _mapper.Map<TaxResultDto>(entity);
                result.TaxAccountName = entity.TaxAccountNavigation?.Name;
                return result;
            }).ToList();
        }
    }
}
