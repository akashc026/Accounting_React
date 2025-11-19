using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateCustomFieldValueHandler : IRequestHandler<UpdateCustomFieldValue, Guid>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public UpdateCustomFieldValueHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<Guid> Handle(UpdateCustomFieldValue request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Set<CustomFieldValue>()
                .FirstOrDefaultAsync(x => x.ID == request.Id, cancellationToken);

            if (entity == null)
                throw new ArgumentException($"CustomFieldValue with ID {request.Id} not found");

            _mapper.Map(request, entity);
            
            await _dbContext.SaveChangesAsync(cancellationToken);
            
            return entity.ID;
        }
    }
} 