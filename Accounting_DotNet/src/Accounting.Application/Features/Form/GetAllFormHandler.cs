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
    public class GetAllFormHandler : GetEntitiesHandler<AccountingDbContext, Form, GetAllForm, PaginatedList<FormResultDto>>
    {
        public GetAllFormHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override IQueryable<Form> ApplyFiltering(IQueryable<Form> queryable, Expression<Func<Form, bool>> predicate, GetAllForm request)
        {
            // Only include essential navigation properties to improve performance
            var query = queryable
                .Include(x => x.TypeOfRecordNavigation)
                .Include(x => x.FormTypeNavigation)
                .Where(predicate);

            var sortBy = request.SortBy?.ToLower();
            var ascending = string.IsNullOrWhiteSpace(request.SortOrder) || request.SortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);

            query = sortBy switch
            {
                "formname" => ascending ? query.OrderBy(x => x.FormName) : query.OrderByDescending(x => x.FormName),
                "typeofrecordname" => ascending
                    ? query.OrderBy(x => x.TypeOfRecordNavigation!.Name)
                    : query.OrderByDescending(x => x.TypeOfRecordNavigation!.Name),
                "prefix" => ascending ? query.OrderBy(x => x.Prefix) : query.OrderByDescending(x => x.Prefix),
                _ => query.OrderBy(x => x.FormName)
            };

            return query;
        }

        protected override IQueryable<Form> ApplyPagination(IQueryable<Form> queryable, GetAllForm request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override Expression<Func<Form, bool>> ComposeFilter(Expression<Func<Form, bool>> predicate, GetAllForm request)
        {
            // Build the filter expression
            Expression<Func<Form, bool>>? filterExpression = null;

            // Add inactive filter (fallback to IsActive for backward compatibility)
            var inactiveFilterValue = request.Inactive;
            if (!inactiveFilterValue.HasValue && request.IsActive.HasValue)
            {
                inactiveFilterValue = request.IsActive.Value ? false : true;
            }

            if (inactiveFilterValue.HasValue)
            {
                Expression<Func<Form, bool>> inactiveFilter = inactiveFilterValue.Value
                    ? x => x.Inactive == true
                    : x => x.Inactive != true;

                filterExpression = filterExpression == null
                    ? inactiveFilter
                    : filterExpression.And(inactiveFilter);
            }

            // Add search text filter
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                var likePattern = $"%{request.SearchText}%";
                Expression<Func<Form, bool>> searchFilter = x =>
                    EF.Functions.Like(x.FormName!, likePattern) ||
                    EF.Functions.Like(x.Prefix!, likePattern) ||
                    (x.TypeOfRecordNavigation != null && EF.Functions.Like(x.TypeOfRecordNavigation.Name!, likePattern));

                filterExpression = filterExpression == null
                    ? searchFilter
                    : filterExpression.And(searchFilter);
            }

            // Apply the filter if any conditions were added
            return filterExpression != null ? predicate.Or(filterExpression) : predicate;
        }

        protected override PaginatedList<FormResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllForm, IEnumerable<Form>> args)
        {
            // Get all unique account IDs from the forms
            var forms = args.Result.ToList();
            var accountIds = new HashSet<Guid>();
            
            foreach (var form in forms)
            {
                if (form.AccountReceivable.HasValue) accountIds.Add(form.AccountReceivable.Value);
                if (form.Clearing.HasValue) accountIds.Add(form.Clearing.Value);
                if (form.AccuredTax.HasValue) accountIds.Add(form.AccuredTax.Value);
                if (form.AccuredAR.HasValue) accountIds.Add(form.AccuredAR.Value);
                if (form.DiscountOnTax.HasValue) accountIds.Add(form.DiscountOnTax.Value);
                if (form.UndepositedFunds.HasValue) accountIds.Add(form.UndepositedFunds.Value);
                if (form.ClearingGRNI.HasValue) accountIds.Add(form.ClearingGRNI.Value);
                if (form.ClearingSRNI.HasValue) accountIds.Add(form.ClearingSRNI.Value);
                if (form.AccountPayable.HasValue) accountIds.Add(form.AccountPayable.Value);
                if (form.ClearingVAT.HasValue) accountIds.Add(form.ClearingVAT.Value);
                if (form.DiscountOnTaxDR.HasValue) accountIds.Add(form.DiscountOnTaxDR.Value);
                if (form.DiscountOnTaxCR.HasValue) accountIds.Add(form.DiscountOnTaxCR.Value);
            }

            // Load account names in a single query
            var accountNames = DbContext.ChartOfAccounts
                .Where(a => accountIds.Contains(a.Id))
                .ToDictionary(a => a.Id, a => a.Name);

            var mappedResults = forms.Select(entity => {
                var result = Mapper.Map<FormResultDto>(entity);
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
                result.FormTypeName = entity.FormTypeNavigation?.Name;
                
                // Map account names using the dictionary lookup
                result.AccountReceivableName = entity.AccountReceivable.HasValue && accountNames.ContainsKey(entity.AccountReceivable.Value) 
                    ? accountNames[entity.AccountReceivable.Value] : null;
                result.ClearingName = entity.Clearing.HasValue && accountNames.ContainsKey(entity.Clearing.Value) 
                    ? accountNames[entity.Clearing.Value] : null;
                result.AccuredTaxName = entity.AccuredTax.HasValue && accountNames.ContainsKey(entity.AccuredTax.Value) 
                    ? accountNames[entity.AccuredTax.Value] : null;
                result.AccuredARName = entity.AccuredAR.HasValue && accountNames.ContainsKey(entity.AccuredAR.Value) 
                    ? accountNames[entity.AccuredAR.Value] : null;
                result.DiscountOnTaxName = entity.DiscountOnTax.HasValue && accountNames.ContainsKey(entity.DiscountOnTax.Value) 
                    ? accountNames[entity.DiscountOnTax.Value] : null;
                result.UndepositedFundsName = entity.UndepositedFunds.HasValue && accountNames.ContainsKey(entity.UndepositedFunds.Value) 
                    ? accountNames[entity.UndepositedFunds.Value] : null;
                result.ClearingGRNIName = entity.ClearingGRNI.HasValue && accountNames.ContainsKey(entity.ClearingGRNI.Value) 
                    ? accountNames[entity.ClearingGRNI.Value] : null;
                result.ClearingSRNIName = entity.ClearingSRNI.HasValue && accountNames.ContainsKey(entity.ClearingSRNI.Value) 
                    ? accountNames[entity.ClearingSRNI.Value] : null;
                result.AccountPayableName = entity.AccountPayable.HasValue && accountNames.ContainsKey(entity.AccountPayable.Value)
                    ? accountNames[entity.AccountPayable.Value] : null;
                result.ClearingVATName = entity.ClearingVAT.HasValue && accountNames.ContainsKey(entity.ClearingVAT.Value)
                    ? accountNames[entity.ClearingVAT.Value] : null;
                result.DiscountOnTaxDRName = entity.DiscountOnTaxDR.HasValue && accountNames.ContainsKey(entity.DiscountOnTaxDR.Value)
                    ? accountNames[entity.DiscountOnTaxDR.Value] : null;
                result.DiscountOnTaxCRName = entity.DiscountOnTaxCR.HasValue && accountNames.ContainsKey(entity.DiscountOnTaxCR.Value)
                    ? accountNames[entity.DiscountOnTaxCR.Value] : null;

                return result;
            });

            var request = args.Request;

            return new PaginatedList<FormResultDto>
            {
                Results = mappedResults,
                TotalItems = args.Count,
                CurrentPage = (request as IPageCollection)?.PageNumber ?? 1,
                PageSize = (request as IPageCollection)?.PageSize ?? 10
            };
        }
    }
} 
