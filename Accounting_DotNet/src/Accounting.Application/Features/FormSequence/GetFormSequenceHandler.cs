using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetFormSequenceHandler : GetEntityHandler<AccountingDbContext, FormSequence, Guid, GetFormSequence, FormSequenceResultDto>
    {
        public GetFormSequenceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<FormSequenceResultDto?> Handle(GetFormSequence request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Form)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override FormSequenceResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetFormSequence, FormSequence?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<FormSequenceResultDto>(entity);
            result.FormName = entity.Form?.FormName ?? string.Empty;
            return result;
        }
    }
} 