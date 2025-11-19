using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetRecordTypeHandler : GetEntityHandler<AccountingDbContext, RecordType, Guid, GetRecordType, RecordTypeResultDto>
    {
        public GetRecordTypeHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<RecordTypeResultDto?> Handle(GetRecordType request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.StandardFields)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override RecordTypeResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetRecordType, RecordType?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<RecordTypeResultDto>(entity);
            result.StandardFieldsCount = entity.StandardFields?.Count ?? 0;
            
            return result;
        }
    }
} 