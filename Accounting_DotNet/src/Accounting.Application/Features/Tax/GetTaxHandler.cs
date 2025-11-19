using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetTaxHandler : IRequestHandler<GetTax, TaxResultDto?>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetTaxHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<TaxResultDto?> Handle(GetTax request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Taxes
                .Include(x => x.TaxAccountNavigation)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity == null)
                return null;

            var result = _mapper.Map<TaxResultDto>(entity);
            result.TaxAccountName = entity.TaxAccountNavigation?.Name;

            return result;
        }
    }
}