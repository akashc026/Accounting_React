using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.Linq.Extensions;
using LinqKit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class DeleteProductHandler : DeleteEntityHandler<AccountingDbContext, Product, Guid, DeleteProduct>
    {
        public DeleteProductHandler(AccountingDbContext dbContext) : base(dbContext)
        {
        }

        public override async Task<Unit> Handle(DeleteProduct request, CancellationToken cancellationToken)
        {
            var entity = await Entities.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (entity is null)
            {
                throw new KeyNotFoundException($"Product with Id of {request.Id} was not found.");
            }

            var totalCount = new OutputParameter<int?>();
            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: "Product",
                primaryKeyColumn: "Id",
                primaryKeyValue: request.Id.ToString(),
                excludeTables: null,
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
                throw new InvalidOperationException("Product delete not allowed due to existing references.");
            }

            entity.IsDeleted = true;
            Entities.Update(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }
    }
}
