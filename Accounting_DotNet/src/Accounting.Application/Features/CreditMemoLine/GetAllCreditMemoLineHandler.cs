using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetAllCreditMemoLineHandler : GetEntitiesHandler<AccountingDbContext, CreditMemoLine, GetAllCreditMemoLine, PaginatedList<CreditMemoLineResultDto>>
    {
        public GetAllCreditMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<CreditMemoLine> ApplyFiltering(IQueryable<CreditMemoLine> queryable, Expression<Func<CreditMemoLine, bool>> predicate, GetAllCreditMemoLine request)
        {
            return queryable
                .Include(x => x.CM)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<CreditMemoLine, bool>> ComposeFilter(Expression<Func<CreditMemoLine, bool>> predicate, GetAllCreditMemoLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) ||
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            if (request.CMID.HasValue)
            {
                predicate = predicate.And(x => x.CMID == request.CMID.Value);
            }

            return predicate;
        }

        protected override IQueryable<CreditMemoLine> ApplyPagination(IQueryable<CreditMemoLine> queryable, GetAllCreditMemoLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CreditMemoLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCreditMemoLine, IEnumerable<CreditMemoLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<CreditMemoLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<CreditMemoLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
