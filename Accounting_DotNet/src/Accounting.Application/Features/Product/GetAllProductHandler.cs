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
            Expression<Func<Product, bool>>? filterExpression = null;

            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var likePattern = $"%{request.SearchText}%";
                Expression<Func<Product, bool>> searchFilter = x =>
                    EF.Functions.Like(x.ItemCode!, likePattern) ||
                    EF.Functions.Like(x.ItemName!, likePattern);

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.Or(searchFilter);
            }

            if (request.ItemType.HasValue)
            {
                Expression<Func<Product, bool>> itemTypeFilter = x => x.ItemType == request.ItemType.Value;
                filterExpression = filterExpression == null
                    ? itemTypeFilter
                    : filterExpression.And(itemTypeFilter);
            }

            if (request.Inactive.HasValue)
            {
                Expression<Func<Product, bool>> inactiveFilter = request.Inactive.Value
                    ? x => x.Inactive == true
                    : x => x.Inactive != true;

                filterExpression = filterExpression == null
                    ? inactiveFilter
                    : filterExpression.And(inactiveFilter);
            }

            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override IQueryable<Product> ApplyFiltering(IQueryable<Product> queryable, Expression<Func<Product, bool>> predicate, GetAllProduct request)
        {
            var query = queryable
                .Include(x => x.PurchaseTaxCodeNavigation)
                .Include(x => x.SalesTaxCodeNavigation)
                .Include(x => x.ItemTypeNavigation)
                .Include(x => x.FormNavigation)
                .Where(predicate);

            if (!string.IsNullOrWhiteSpace(request.SortBy))
            {
                var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);
                query = request.SortBy.Equals("itemcode", StringComparison.OrdinalIgnoreCase)
                    ? (ascending ? query.OrderBy(x => x.ItemCode) : query.OrderByDescending(x => x.ItemCode))
                    : request.SortBy.Equals("itemname", StringComparison.OrdinalIgnoreCase)
                        ? (ascending ? query.OrderBy(x => x.ItemName) : query.OrderByDescending(x => x.ItemName))
                        : query;
            }

            return query;
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
