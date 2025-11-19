using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
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
    public class GetAllFormSourceTypeHandler : GetEntitiesHandler<AccountingDbContext, FormSourceType, GetAllFormSourceType, IEnumerable<FormSourceTypeResultDto>>
    {
        public GetAllFormSourceTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override Expression<Func<FormSourceType, bool>> ComposeFilter(Expression<Func<FormSourceType, bool>> predicate, GetAllFormSourceType request)
        {
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                return predicate.Or(x => EF.Functions.Like(x.Name, $"%{request.SearchText}%"));
            }

            return predicate;
        }

        protected override IQueryable<FormSourceType> ApplyPagination(IQueryable<FormSourceType> queryable, GetAllFormSourceType request)
        {
            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                return base.ApplyPagination(queryable, request);
            }

            // Return all results without pagination
            return queryable;
        }

        protected override IEnumerable<FormSourceTypeResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetAllFormSourceType, IEnumerable<FormSourceType>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<FormSourceTypeResultDto>(entity);
                return result;
            });

            return mappedResults;
        }
    }
}
