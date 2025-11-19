using Accounting.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class UpdateCustomFieldValuesHandler : IRequestHandler<UpdateCustomFieldValues, int>
    {
        private readonly AccountingDbContext _dbContext;

        public UpdateCustomFieldValuesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> Handle(UpdateCustomFieldValues request, CancellationToken cancellationToken)
        {
            if (request.Values == null || !request.Values.Any())
            {
                return 0;
            }

            var ids = request.Values.Select(v => v.ID).ToList();
            var existingValues = await _dbContext.CustomFieldValues
                .Where(value => ids.Contains(value.ID))
                .ToListAsync(cancellationToken);

            if (!existingValues.Any())
            {
                return 0;
            }

            foreach (var existingValue in existingValues)
            {
                var updateDto = request.Values.FirstOrDefault(v => v.ID == existingValue.ID);
                if (updateDto != null)
                {
                    // Only update fields that are provided (not null)
                    if (updateDto.TypeOfRecord.HasValue)
                        existingValue.TypeOfRecord = updateDto.TypeOfRecord.Value;

                    if (updateDto.ValueText != null)
                        existingValue.ValueText = updateDto.ValueText;

                    if (updateDto.CustomFieldID.HasValue)
                        existingValue.CustomFieldID = updateDto.CustomFieldID.Value;

                    if (updateDto.RecordID != null)
                        existingValue.RecordID = updateDto.RecordID;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return existingValues.Count;
        }
    }
}
