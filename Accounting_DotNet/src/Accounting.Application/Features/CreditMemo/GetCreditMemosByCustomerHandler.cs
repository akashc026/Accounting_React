using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetCreditMemosByCustomerHandler : IRequestHandler<GetCreditMemosByCustomer, List<CreditMemoResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetCreditMemosByCustomerHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<CreditMemoResultDto>> Handle(GetCreditMemosByCustomer request, CancellationToken cancellationToken)
        {
            var creditMemos = await _dbContext.CreditMemos
                .Include(x => x.FormNavigation)
                .Include(x => x.Customer)
                .Include(x => x.Location)
                .Where(x => x.CustomerID == request.CustomerId)
                .ToListAsync(cancellationToken);

            return creditMemos.Select(entity => {
                var result = _mapper.Map<CreditMemoResultDto>(entity);
                result.FormName = entity.FormNavigation?.FormName;
                result.CustomerName = entity.Customer?.Name;
                result.LocationName = entity.Location?.Name;
                return result;
            }).ToList();
        }
    }
}
