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
            var entities = Entities.AsExpandable();
            var predicate = ComposeFilter(PredicateBuilder.New<Product>(), request);

            var entity = await entities.FirstOrDefaultAsync(predicate, cancellationToken);
            if (entity is null)
            {
                if (ThrowIfEntityNotFound)
                {
                    throw new KeyNotFoundException($"Product with Id of {request.Id} was not found.");
                }
                else
                {
                    return Unit.Value;
                }
            }

            // Perform hard delete
            Entities.Remove(entity);

            return await SaveChangesAsync(request, entity, cancellationToken);
        }

        protected override Expression<Func<Product, bool>> ComposeFilter(Expression<Func<Product, bool>> predicate, DeleteProduct request)
        {
            return predicate.Eq(e => e.Id, request.Id);
        }
    }
} 