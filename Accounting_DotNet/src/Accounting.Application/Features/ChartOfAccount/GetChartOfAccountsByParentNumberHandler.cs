using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsByParentNumberHandler : IRequestHandler<GetChartOfAccountsByParentNumber, List<ChartOfAccountResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetChartOfAccountsByParentNumberHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<ChartOfAccountResultDto>> Handle(GetChartOfAccountsByParentNumber request, CancellationToken cancellationToken)
        {
            var chartOfAccounts = await _dbContext.ChartOfAccounts
                .Include(x => x.ParentNavigation)
                .Where(x => x.ParentNumber == request.ParentNumber)
                .OrderBy(x => x.AccountNumber)
                .ThenBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return chartOfAccounts.Select(entity => {
                var result = _mapper.Map<ChartOfAccountResultDto>(entity);
                result.ParentName = entity.ParentNavigation?.Name;
                return result;
            }).ToList();
        }
    }
} 