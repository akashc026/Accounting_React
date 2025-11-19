using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.Application.Features.Results;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetAllProductHandler : GetEntitiesHandler<AccountingDbContext, Product, GetAllProduct, List<ProductResultDto>>
    {
        public GetAllProductHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<Product, bool>> ComposeFilter(Expression<Func<Product, bool>> predicate, GetAllProduct request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.ItemName, request.SearchText) || EF.Functions.Like(x.ItemCode, request.SearchText));
            }

            return predicate;
        }

        protected override IQueryable<Product> ApplyFiltering(IQueryable<Product> queryable, Expression<Func<Product, bool>> predicate, GetAllProduct request)
        {
            return queryable
                .Include(x => x.PurchaseTaxCodeNavigation)
                .Include(x => x.SalesTaxCodeNavigation)
                .Include(x => x.ItemTypeNavigation)
                .Include(x => x.FormNavigation)
                .Where(predicate);
        }

        protected override IQueryable<Product> ApplyPagination(IQueryable<Product> queryable, GetAllProduct request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override List<ProductResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllProduct, IEnumerable<Product>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<ProductResultDto>(entity);
                result.PurchaseTaxCodeName = entity.PurchaseTaxCodeNavigation?.Name;
                result.SalesTaxCodeName = entity.SalesTaxCodeNavigation?.Name;
                result.ItemTypeName = entity.ItemTypeNavigation?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();

            return mappedResults;
        }
    }
} 