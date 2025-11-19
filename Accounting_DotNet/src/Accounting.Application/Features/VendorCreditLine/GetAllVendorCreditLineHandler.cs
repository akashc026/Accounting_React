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
    public class GetAllVendorCreditLineHandler : GetEntitiesHandler<AccountingDbContext, VendorCreditLine, GetAllVendorCreditLine, PaginatedList<VendorCreditLineResultDto>>
    {
        public GetAllVendorCreditLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorCreditLine> ApplyFiltering(IQueryable<VendorCreditLine> queryable, Expression<Func<VendorCreditLine, bool>> predicate, GetAllVendorCreditLine request)
        {
            return queryable
                .Include(x => x.VC)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<VendorCreditLine, bool>> ComposeFilter(Expression<Func<VendorCreditLine, bool>> predicate, GetAllVendorCreditLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => x.Quantity.ToString().Contains(request.SearchText) ||
                                              x.Rate.ToString().Contains(request.SearchText));
            }

            if (request.VCID.HasValue)
            {
                predicate = predicate.And(x => x.VCID == request.VCID.Value);
            }

            return predicate;
        }

        protected override IQueryable<VendorCreditLine> ApplyPagination(IQueryable<VendorCreditLine> queryable, GetAllVendorCreditLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorCreditLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorCreditLine, IEnumerable<VendorCreditLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorCreditLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorCreditLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
}
