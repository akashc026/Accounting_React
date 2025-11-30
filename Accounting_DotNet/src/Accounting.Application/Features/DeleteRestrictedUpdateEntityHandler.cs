using Accounting.Persistence;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using ExcentOne.Persistence.Features.Models;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Reflection;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public abstract class DeleteRestrictedUpdateEntityHandler<TEntity, TCommand> :
        UpdateEntityHandler<AccountingDbContext, TEntity, Guid, TCommand, Guid>
        where TEntity : class, IEntity<Guid>
        where TCommand : IUpdateEntity<Guid, Guid>
    {
        private static readonly PropertyInfo? IsDeletedProperty = typeof(TCommand).GetProperty("IsDeleted");

        protected DeleteRestrictedUpdateEntityHandler(AccountingDbContext dbContext, IMapper mapper)
            : base(dbContext, mapper)
        {
        }

        public override async Task<Guid> Handle(TCommand request, CancellationToken cancellationToken)
        {
            if (IsDeletionRequested(request))
            {
                await EnsureNoBlockingReferencesAsync(request, cancellationToken);
            }

            return await base.Handle(request, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<TCommand, TEntity> args)
        {
            return args.Entity.Id;
        }

        private static bool IsDeletionRequested(TCommand request)
        {
            if (IsDeletedProperty == null)
            {
                return false;
            }

            var value = IsDeletedProperty.GetValue(request);
            return value is bool boolValue && boolValue;
        }

        private async Task EnsureNoBlockingReferencesAsync(TCommand request, CancellationToken cancellationToken)
        {
            var tableName = GetTableName();
            if (string.IsNullOrWhiteSpace(tableName))
            {
                return;
            }

            var totalCount = new OutputParameter<int?>();

            await DbContext.Procedures.CheckBlockingReferencesAsync(
                tableName: tableName,
                primaryKeyColumn: GetPrimaryKeyColumnName(),
                primaryKeyValue: request.Id.ToString(),
                excludeTables: GetExcludedTables(),
                totalCount: totalCount,
                cancellationToken: cancellationToken);

            if ((totalCount.Value ?? 0) > 0)
            {
               throw new InvalidOperationException($"{GetEntityDisplayName()} delete not allowed due to existing references.");
            }
        }

        protected virtual string? GetExcludedTables() => null;

        protected virtual string GetPrimaryKeyColumnName() => "Id";

        protected virtual string GetEntityDisplayName() => typeof(TEntity).Name;

        protected virtual string? GetTableName()
        {
            var entityType = DbContext.Model.FindEntityType(typeof(TEntity));
            return entityType?.GetTableName() ?? typeof(TEntity).Name;
        }
    }
}
