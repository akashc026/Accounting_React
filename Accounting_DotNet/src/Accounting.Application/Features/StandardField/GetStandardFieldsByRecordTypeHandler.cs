using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetStandardFieldsByRecordTypeHandler : DbQueryHandler<AccountingDbContext, StandardField, GetStandardFieldsByRecordType, IEnumerable<StandardField>, List<StandardFieldResultDto>>
    {
        protected readonly IMapper Mapper;

        public GetStandardFieldsByRecordTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext)
        {
            Mapper = mapper;
        }

        public override async Task<List<StandardFieldResultDto>> Handle(GetStandardFieldsByRecordType request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var queryable = Entities
                    .Include(x => x.TypeOfRecordNavigation)
                    .Include(x => x.FieldTypeNavigation)
                    .Where(x => x.TypeOfRecord == request.RecordTypeId)
                    .AsExpandable();

                // Apply sorting
                queryable = queryable.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name);

                var entities = await queryable.ToListAsync(cancellationToken);

                return new(request, entities, entities.Count);
            }, request, cancellationToken);
        }

        protected override Expression<Func<StandardField, bool>> ComposeFilter(Expression<Func<StandardField, bool>> predicate, GetStandardFieldsByRecordType request)
        {
            return predicate.And(x => x.TypeOfRecord == request.RecordTypeId);
        }

        protected override List<StandardFieldResultDto> OnQuerySuccess(DbQuerySuccessArgs<GetStandardFieldsByRecordType, IEnumerable<StandardField>> args)
        {
            var entities = args.Result;
            var mappedResults = entities.Select(entity =>
            {
                var result = Mapper.Map<StandardFieldResultDto>(entity);
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
                result.FieldTypeName = entity.FieldTypeNavigation?.ComponentName ?? string.Empty;
                return result;
            });

            return mappedResults.ToList();
        }
    }
} 