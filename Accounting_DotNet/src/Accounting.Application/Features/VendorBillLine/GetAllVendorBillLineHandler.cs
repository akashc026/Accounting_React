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
    public class GetAllVendorBillLineHandler : GetEntitiesHandler<AccountingDbContext, VendorBillLine, GetAllVendorBillLine, PaginatedList<VendorBillLineResultDto>>
    {
        public GetAllVendorBillLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<VendorBillLine> ApplyFiltering(IQueryable<VendorBillLine> queryable, Expression<Func<VendorBillLine, bool>> predicate, GetAllVendorBillLine request)
        {
            return queryable
                .Include(x => x.VB)
                .Include(x => x.Item)
                .Include(x => x.Tax)
                .Where(predicate);
        }

        protected override Expression<Func<VendorBillLine, bool>> ComposeFilter(Expression<Func<VendorBillLine, bool>> predicate, GetAllVendorBillLine request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                predicate = predicate.And(x => EF.Functions.Like(x.Item.ItemName, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<VendorBillLine> ApplyPagination(IQueryable<VendorBillLine> queryable, GetAllVendorBillLine request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override PaginatedList<VendorBillLineResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllVendorBillLine, IEnumerable<VendorBillLine>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<VendorBillLineResultDto>(entity);
                
                // TaxAmount is already stored in the database, but ensure it's properly mapped
                // If TaxAmount is 0 but TaxPercent > 0, recalculate it
                if (result.TaxAmount == 0 && entity.TaxPercent > 0)
                {
                    result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
                }
                
                return result;
            });

            var request = args.Request;

            return new PaginatedList<VendorBillLineResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
