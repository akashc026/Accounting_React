using Accounting.Persistence;
using Accounting.Persistence.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateCustomFieldValuesHandler : IRequestHandler<CreateCustomFieldValues, List<Guid>>
    {
        private readonly AccountingDbContext _dbContext;

        public CreateCustomFieldValuesHandler(AccountingDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<Guid>> Handle(CreateCustomFieldValues request, CancellationToken cancellationToken)
        {
            var createdIds = new List<Guid>();

            if (request.Values == null || !request.Values.Any())
            {
                return createdIds;
            }

            foreach (var valueDto in request.Values)
            {
                var customFieldValue = new CustomFieldValue
                {
                    ID = Guid.NewGuid(),
                    TypeOfRecord = valueDto.TypeOfRecord,
                    ValueText = valueDto.ValueText,
                    CustomFieldID = valueDto.CustomFieldID,
                    RecordID = valueDto.RecordID
                };

                _dbContext.CustomFieldValues.Add(customFieldValue);
                createdIds.Add(customFieldValue.ID);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return createdIds;
        }
    }
}
