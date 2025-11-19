using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetCustomFieldValueHandler : IRequestHandler<GetCustomFieldValue, CustomFieldValueResultDto>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetCustomFieldValueHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<CustomFieldValueResultDto> Handle(GetCustomFieldValue request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Set<CustomFieldValue>()
                .Include(x => x.CustomField)
                .Include(x => x.TypeOfRecordNavigation)
                .FirstOrDefaultAsync(x => x.ID == request.Id, cancellationToken);

            if (entity == null)
                throw new ArgumentException($"CustomFieldValue with ID {request.Id} not found");

            var dto = _mapper.Map<CustomFieldValueResultDto>(entity);
            dto.CustomFieldName = entity.CustomField?.FieldName ?? string.Empty;
            dto.TypeOfRecordName = entity.TypeOfRecordNavigation?.Name ?? string.Empty;
            
            return dto;
        }
    }
} 