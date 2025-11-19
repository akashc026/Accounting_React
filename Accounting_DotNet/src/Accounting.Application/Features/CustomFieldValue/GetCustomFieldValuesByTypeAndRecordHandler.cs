using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetCustomFieldValuesByTypeAndRecordHandler : IRequestHandler<GetCustomFieldValuesByTypeAndRecord, List<CustomFieldValueResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetCustomFieldValuesByTypeAndRecordHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<CustomFieldValueResultDto>> Handle(GetCustomFieldValuesByTypeAndRecord request, CancellationToken cancellationToken)
        {
            var customFieldValues = await _dbContext.CustomFieldValues
                .Include(x => x.CustomField)
                .Include(x => x.TypeOfRecordNavigation)
                .Where(x => x.TypeOfRecord == request.TypeOfRecord && x.RecordID == request.RecordID)
                .OrderBy(x => x.CustomField != null ? x.CustomField.DisplayOrder : 0)
                .ThenBy(x => x.CustomField != null ? x.CustomField.FieldName : "")
                .ToListAsync(cancellationToken);

            return customFieldValues.Select(entity => {
                var result = _mapper.Map<CustomFieldValueResultDto>(entity);
                result.CustomFieldName = entity.CustomField?.FieldName ?? string.Empty;
                result.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
                return result;
            }).ToList();
        }
    }
} 