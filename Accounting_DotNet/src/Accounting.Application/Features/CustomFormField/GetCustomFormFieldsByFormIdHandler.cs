using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetCustomFormFieldsByFormIdHandler : IRequestHandler<GetCustomFormFieldsByFormId, List<CustomFormFieldResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetCustomFormFieldsByFormIdHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<CustomFormFieldResultDto>> Handle(GetCustomFormFieldsByFormId request, CancellationToken cancellationToken)
        {
            var customFormFields = await _dbContext.CustomFormFields
                .Include(x => x.Form)
                .Include(x => x.FieldTypeNavigation)
                .Where(x => x.FormId == request.FormId)
                .OrderBy(x => x.DisplayOrder)
                .ThenBy(x => x.FieldName)
                .ToListAsync(cancellationToken);

            return customFormFields.Select(entity => {
                var result = _mapper.Map<CustomFormFieldResultDto>(entity);
                result.FormName = entity.Form?.FormName ?? string.Empty;
                result.FieldTypeName = entity.FieldTypeNavigation?.ComponentName;
                return result;
            }).ToList();
        }
    }
} 