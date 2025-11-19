using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateSalesOrderLineHandler : CreateEntityHandler<AccountingDbContext, SalesOrderLine, Guid, CreateSalesOrderLine, Guid>
    {
        public CreateSalesOrderLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<SalesOrderLine> CreateEntityAsync(CreateSalesOrderLine request, IMapper mapper, CancellationToken cancellationToken)
        {
            // Validate that the SalesOrder exists
            var salesOrderExists = await DbContext.SalesOrders
                .AnyAsync(so => so.Id == request.SOID, cancellationToken);

            if (!salesOrderExists)
            {
                throw new InvalidOperationException($"Sales Order with ID '{request.SOID}' does not exist.");
            }

            // Create the entity using the base method
            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateSalesOrderLine, SalesOrderLine> args)
        {
            return args.Entity.Id;
        }
    }
} 