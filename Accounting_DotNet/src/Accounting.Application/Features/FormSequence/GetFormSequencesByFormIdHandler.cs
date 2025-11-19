using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetFormSequencesByFormIdHandler : IRequestHandler<GetFormSequencesByFormId, List<FormSequenceResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetFormSequencesByFormIdHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<FormSequenceResultDto>> Handle(GetFormSequencesByFormId request, CancellationToken cancellationToken)
        {
            var formSequences = await _dbContext.FormSequences
                .Include(x => x.Form)
                .Where(x => x.FormId == request.FormId)
                .OrderBy(x => x.FormSequenceNumber)
                .ToListAsync(cancellationToken);

            return formSequences.Select(entity => {
                var result = _mapper.Map<FormSequenceResultDto>(entity);
                result.FormName = entity.Form?.FormName ?? string.Empty;
                return result;
            }).ToList();
        }
    }
} 