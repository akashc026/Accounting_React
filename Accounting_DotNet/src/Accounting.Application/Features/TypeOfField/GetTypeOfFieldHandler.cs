using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetTypeOfFieldHandler : GetEntityHandler<AccountingDbContext, TypeOfField, Guid, GetTypeOfField, TypeOfFieldResultDto>
    {
        public GetTypeOfFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<TypeOfFieldResultDto?> Handle(GetTypeOfField request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.StandardFields)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override TypeOfFieldResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetTypeOfField, TypeOfField?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<TypeOfFieldResultDto>(entity);
            result.StandardFieldsCount = entity.StandardFields?.Count ?? 0;
            
            return result;
        }
    }
} 