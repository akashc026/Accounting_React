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
    public class GetAllCreditMemoPaymentLineHandler : GetEntitiesHandler<AccountingDbContext, CreditMemoPaymentLine, GetAllCreditMemoPaymentLine, PaginatedList<CreditMemoPaymentLineResultDto>>
    {
        public GetAllCreditMemoPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<CreditMemoPaymentLine> ApplyFiltering(IQueryable<CreditMemoPaymentLine> queryable, Expression<Func<CreditMemoPaymentLine, bool>> predicate, GetAllCreditMemoPaymentLine request)
        {
            return queryable
                .Where(predicate);
        }

        protected override Expression<Func<CreditMemoPaymentLine, bool>> ComposeFilter(Expression<Func<CreditMemoPaymentLine, bool>> predicate, GetAllCreditMemoPaymentLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.RecordID, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<CreditMemoPaymentLine> ApplyPagination(IQueryable<CreditMemoPaymentLine> queryable, GetAllCreditMemoPaymentLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CreditMemoPaymentLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCreditMemoPaymentLine, IEnumerable<CreditMemoPaymentLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<CreditMemoPaymentLineResultDto>(entity);
                return result;
            });

            var request = args.Request;

            return new PaginatedList<CreditMemoPaymentLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
