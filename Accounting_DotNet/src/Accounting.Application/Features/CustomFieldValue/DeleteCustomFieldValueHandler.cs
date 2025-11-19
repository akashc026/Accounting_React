using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class DeleteCustomFieldValueHandler : IRequestHandler<DeleteCustomFieldValue>
    {
        private readonly AccountingDbContext _dbContext;

        public DeleteCustomFieldValueHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task Handle(DeleteCustomFieldValue request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Set<CustomFieldValue>()
                .FirstOrDefaultAsync(x => x.ID == request.Id, cancellationToken);

            if (entity == null)
                throw new ArgumentException($"CustomFieldValue with ID {request.Id} not found");

            _dbContext.Set<CustomFieldValue>().Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
} 