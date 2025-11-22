using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Results;
using MediatR;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetAllCustomFieldValueHandler : IRequestHandler<GetAllCustomFieldValue, PaginatedList<CustomFieldValueResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetAllCustomFieldValueHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<PaginatedList<CustomFieldValueResultDto>> Handle(GetAllCustomFieldValue request, CancellationToken cancellationToken)
        {
            var query = _dbContext.Set<CustomFieldValue>()
                .Include(x => x.CustomField)
                .Include(x => x.TypeOfRecordNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                query = query.Where(x => EF.Functions.Like(x.ValueText, $"%{request.SearchText}%") ||
                                       (x.CustomField != null && EF.Functions.Like(x.CustomField.FieldName, $"%{request.SearchText}%")));
            }

            query = query.OrderByDescending(x => x.CreatedDate);

            var totalItems = await query.CountAsync(cancellationToken);

            // Only apply pagination if both PageNumber and PageSize are provided (greater than 0)
            if (request.PageNumber > 0 && request.PageSize > 0)
            {
                query = query
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize);
            }

            var items = await query.ToListAsync(cancellationToken);

            var mappedResults = items.Select(item => new CustomFieldValueResultDto
            {
                ID = item.ID,
                RecordID = item.RecordID,
                TypeOfRecord = item.TypeOfRecord,
                ValueText = item.ValueText,
                CustomFieldID = item.CustomFieldID,
                CustomFieldName = item.CustomField?.FieldName ?? string.Empty,
                TypeOfRecordName = item.TypeOfRecordNavigation?.Name ?? string.Empty,
                CreatedDate = item.CreatedDate,
                CreatedBy = item.CreatedBy
            });

            return new PaginatedList<CustomFieldValueResultDto>
            {
                Results = mappedResults,
                TotalItems = totalItems,
                CurrentPage = request.PageNumber,
                PageSize = request.PageSize
            };
        }
    }
} 
