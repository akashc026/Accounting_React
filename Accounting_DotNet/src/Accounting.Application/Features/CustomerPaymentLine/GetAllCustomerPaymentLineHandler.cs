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
    public class GetAllCustomerPaymentLineHandler : GetEntitiesHandler<AccountingDbContext, CustomerPaymentLine, GetAllCustomerPaymentLine, PaginatedList<CustomerPaymentLineResultDto>>
    {
        public GetAllCustomerPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<CustomerPaymentLine> ApplyFiltering(IQueryable<CustomerPaymentLine> queryable, Expression<Func<CustomerPaymentLine, bool>> predicate, GetAllCustomerPaymentLine request)
        {
            return queryable
                .Where(predicate);
        }

        protected override Expression<Func<CustomerPaymentLine, bool>> ComposeFilter(Expression<Func<CustomerPaymentLine, bool>> predicate, GetAllCustomerPaymentLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.RecordID, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<CustomerPaymentLine> ApplyPagination(IQueryable<CustomerPaymentLine> queryable, GetAllCustomerPaymentLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<CustomerPaymentLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllCustomerPaymentLine, IEnumerable<CustomerPaymentLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<CustomerPaymentLineResultDto>(entity);
                return result;
            });

            var request = args.Request;

            return new PaginatedList<CustomerPaymentLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
