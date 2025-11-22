using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetAllTaxHandler : IRequestHandler<GetAllTax, PaginatedList<TaxResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetAllTaxHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<PaginatedList<TaxResultDto>> Handle(GetAllTax request, CancellationToken cancellationToken)
        {
            var query = _dbContext.Taxes
                .Include(x => x.TaxAccountNavigation)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var likePattern = $"%{request.SearchText}%";
                Expression<Func<Tax, bool>> searchExpression = x => EF.Functions.Like(x.Name!, likePattern);

                if (decimal.TryParse(request.SearchText, out var taxRateSearch))
                {
                    Expression<Func<Tax, bool>> rateExpression = x => x.TaxRate == taxRateSearch;
                    searchExpression = searchExpression.Or(rateExpression);
                }

                query = query.Where(searchExpression);
            }

            // Apply inactive filter (supports legacy IsActive parameter as fallback)
            var inactiveFilterValue = request.Inactive;
            if (!inactiveFilterValue.HasValue && request.IsActive.HasValue)
            {
                inactiveFilterValue = request.IsActive.Value ? false : true;
            }

            if (inactiveFilterValue.HasValue)
            {
                query = inactiveFilterValue.Value
                    ? query.Where(x => x.Inactive == true)
                    : query.Where(x => x.Inactive != true);
            }

            // Apply sorting (default to Id when sort not specified)
            if (!string.IsNullOrWhiteSpace(request.SortBy) && request.SortBy.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = ascending ? query.OrderBy(x => x.Name) : query.OrderByDescending(x => x.Name);
            }
            else
            {
                query = query.OrderByDescending(x => x.CreatedDate);
            }

            var totalItems = await query.CountAsync(cancellationToken);

            // Apply pagination only if both PageNumber and PageSize are provided (greater than 0)
            IEnumerable<Tax> entities;
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                var pageNumber = request.PageNumber;
                var pageSize = request.PageSize;
                var skip = (pageNumber - 1) * pageSize;

                entities = await query
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                entities = await query.ToListAsync(cancellationToken);
            }

            var results = entities.Select(entity =>
            {
                var dto = _mapper.Map<TaxResultDto>(entity);
                dto.TaxAccountName = entity.TaxAccountNavigation?.Name;
                return dto;
            });

            return new PaginatedList<TaxResultDto>
            {
                Results = results,
                TotalItems = totalItems,
                CurrentPage = request.PageNumber > 0 ? request.PageNumber : 1,
                PageSize = request.PageSize > 0 ? request.PageSize : totalItems
            };
        }
    }
}
