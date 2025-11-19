using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetRecordTypeByNameHandler : DbQueryHandler<AccountingDbContext, RecordType, GetRecordTypeByName, RecordType?, RecordTypeResultDto?>
    {
        protected readonly IMapper Mapper;

        public GetRecordTypeByNameHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext)
        {
            Mapper = mapper;
        }

        public override async Task<RecordTypeResultDto?> Handle(GetRecordTypeByName request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.StandardFields)
                    .FirstOrDefaultAsync(x => x.Name.ToLower() == request.Name.ToLower(), cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override Expression<Func<RecordType, bool>> ComposeFilter(Expression<Func<RecordType, bool>> predicate, GetRecordTypeByName request)
        {
            return predicate.And(x => x.Name.ToLower() == request.Name.ToLower());
        }

        protected override RecordTypeResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetRecordTypeByName, RecordType?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<RecordTypeResultDto>(entity);
            result.StandardFieldsCount = entity.StandardFields?.Count ?? 0;
            
            return result;
        }
    }
} 