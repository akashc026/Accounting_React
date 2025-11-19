using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Queries.Parameters;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetAllVendorCreditPaymentLineHandler : GetEntitiesHandler<AccountingDbContext, VendorCreditPaymentLine, GetAllVendorCreditPaymentLine, PaginatedList<VendorCreditPaymentLineResultDto>>
    {
        public GetAllVendorCreditPaymentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<VendorCreditPaymentLine, bool>> ComposeFilter(Expression<Func<VendorCreditPaymentLine, bool>> predicate, GetAllVendorCreditPaymentLine request)
        {
            if (!string.IsNullOrEmpty(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.RecordID, $"%{request.SearchText}%") ||
                                         EF.Functions.Like(x.RefNo, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<VendorCreditPaymentLine> ApplyPagination(IQueryable<VendorCreditPaymentLine> queryable, GetAllVendorCreditPaymentLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorCreditPaymentLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorCreditPaymentLine, IEnumerable<VendorCreditPaymentLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity => Mapper.Map<VendorCreditPaymentLineResultDto>(entity));

            var request = args.Request;

            return new PaginatedList<VendorCreditPaymentLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
