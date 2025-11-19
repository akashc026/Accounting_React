using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetChartOfAccountsByAccountTypeHandler : IRequestHandler<GetChartOfAccountsByAccountType, List<ChartOfAccountResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetChartOfAccountsByAccountTypeHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<ChartOfAccountResultDto>> Handle(GetChartOfAccountsByAccountType request, CancellationToken cancellationToken)
        {
            var chartOfAccounts = await _dbContext.ChartOfAccounts
                .Include(x => x.AccountTypeNavigation)
                .Include(x => x.ParentNavigation)
                .Where(x => x.AccountType == request.AccountTypeId && x.IsParent != true && x.Inactive != true)
                .OrderBy(x => x.AccountNumber)
                .ThenBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return chartOfAccounts.Select(entity => {
                var result = _mapper.Map<ChartOfAccountResultDto>(entity);
                result.AccountTypeName = entity.AccountTypeNavigation?.Name;
                result.ParentName = entity.ParentNavigation?.Name;
                return result;
            }).ToList();
        }
    }
}
