using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using LinqKit;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Accounting.Application.Features
{
    public class GetStandardFieldHandler : GetEntityHandler<AccountingDbContext, StandardField, Guid, GetStandardField, StandardFieldResultDto>
    {
        public GetStandardFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<StandardFieldResultDto?> Handle(GetStandardField request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.TypeOfRecordNavigation)
                    .Include(x => x.FieldTypeNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override StandardFieldResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetStandardField, StandardField?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<StandardFieldResultDto>(entity);
            result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name;
            result.FieldTypeName = entity.FieldTypeNavigation?.ComponentName;
            
            return result;
        }
    }
} 