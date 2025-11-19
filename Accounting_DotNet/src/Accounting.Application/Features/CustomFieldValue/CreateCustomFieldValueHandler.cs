using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class CreateCustomFieldValueHandler : IRequestHandler<CreateCustomFieldValue, Guid>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public CreateCustomFieldValueHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<Guid> Handle(CreateCustomFieldValue request, CancellationToken cancellationToken)
        {
            var entity = _mapper.Map<CustomFieldValue>(request);
            entity.ID = request.Id;
            
            _dbContext.Set<CustomFieldValue>().Add(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.ID;
        }
    }
} 