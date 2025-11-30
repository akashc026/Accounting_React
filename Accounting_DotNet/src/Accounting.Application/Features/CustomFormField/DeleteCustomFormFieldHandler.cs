using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteCustomFormFieldHandler : DeleteEntityHandler<AccountingDbContext, CustomFormField, Guid, DeleteCustomFormField>
    {
        public DeleteCustomFormFieldHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteCustomFormField request, CancellationToken cancellationToken)
        {
            var entity = await Entities
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (entity is null)
            {
                throw new KeyNotFoundException($"CustomFormField with Id of {request.Id} was not found.");
            }

            await SoftDeleteValuesAsync(request.Id, cancellationToken);

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        private async Task SoftDeleteValuesAsync(Guid customFieldId, CancellationToken cancellationToken)
        {
            var values = await DbContext.CustomFieldValues
                .IgnoreQueryFilters()
                .Where(x => x.CustomFieldID == customFieldId)
                .ToListAsync(cancellationToken);

            if (values.Count == 0)
            {
                return;
            }

            foreach (var value in values)
            {
                value.IsDeleted = true;
            }

            DbContext.CustomFieldValues.UpdateRange(values);
        }
    }
} 
