using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class UpdateFormIsDefaultHandler : IRequestHandler<UpdateFormIsDefault, Guid>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateFormIsDefaultHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> Handle(UpdateFormIsDefault request, CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Forms.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity == null)
            {
                throw new InvalidOperationException($"Form with ID {request.Id} not found.");
            }

            entity.IsDefault = request.IsDefault;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}
