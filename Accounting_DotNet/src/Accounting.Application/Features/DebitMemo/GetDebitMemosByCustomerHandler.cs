using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetDebitMemosByCustLocHandler : IRequestHandler<GetDebitMemosByCustLoc, List<DebitMemoResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetDebitMemosByCustLocHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<DebitMemoResultDto>> Handle(GetDebitMemosByCustLoc request, CancellationToken cancellationToken)
        {
            var query = _dbContext.DebitMemos
                .Include(x => x.Customer)
                .Include(x => x.FormNavigation)
                .Include(x => x.Location)
                .Include(x => x.StatusNavigation)
                .Where(x => x.CustomerID == request.CustomerId)
                .Where(x => x.LocationID == request.LocationId)
                .Where(x => x.StatusNavigation != null && x.StatusNavigation.Name == "Open");

            var debitMemos = await query.ToListAsync(cancellationToken);

            return debitMemos.Select(entity => {
                var result = _mapper.Map<DebitMemoResultDto>(entity);
                result.CustomerName = entity.Customer?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.LocationName = entity.Location?.Name;
                result.StatusName = entity.StatusNavigation?.Name;
                return result;
            }).ToList();
        }
    }
}
