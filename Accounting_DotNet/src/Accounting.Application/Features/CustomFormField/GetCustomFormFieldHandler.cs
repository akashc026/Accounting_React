using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetCustomFormFieldHandler : GetEntityHandler<AccountingDbContext, CustomFormField, Guid, GetCustomFormField, CustomFormFieldResultDto>
    {
        public GetCustomFormFieldHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<CustomFormFieldResultDto?> Handle(GetCustomFormField request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Form)
                    .Include(x => x.FieldTypeNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override CustomFormFieldResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetCustomFormField, CustomFormField?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<CustomFormFieldResultDto>(entity);
            result.FormName = entity.Form?.FormName;
            result.FieldTypeName = entity.FieldTypeNavigation?.ComponentName;
            return result;
        }
    }
} 