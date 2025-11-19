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
    public class GetAllDebitMemoLineHandler : GetEntitiesHandler<AccountingDbContext, DebitMemoLine, GetAllDebitMemoLine, PaginatedList<DebitMemoLineResultDto>>
    {
        public GetAllDebitMemoLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<DebitMemoLine> ApplyFiltering(IQueryable<DebitMemoLine> queryable, Expression<Func<DebitMemoLine, bool>> predicate, GetAllDebitMemoLine request)
        {
            return queryable
                .Include(x => x.DebitMemo)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<DebitMemoLine, bool>> ComposeFilter(Expression<Func<DebitMemoLine, bool>> predicate, GetAllDebitMemoLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) ||
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            if (request.DebitMemoId.HasValue)
            {
                predicate = predicate.And(x => x.DebitMemoId == request.DebitMemoId.Value);
            }

            return predicate;
        }

        protected override IQueryable<DebitMemoLine> ApplyPagination(IQueryable<DebitMemoLine> queryable, GetAllDebitMemoLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<DebitMemoLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllDebitMemoLine, IEnumerable<DebitMemoLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<DebitMemoLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<DebitMemoLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
