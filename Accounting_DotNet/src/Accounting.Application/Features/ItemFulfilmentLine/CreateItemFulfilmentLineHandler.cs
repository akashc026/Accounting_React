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
    public class CreateItemFulfilmentLineHandler : CreateEntityHandler<AccountingDbContext, ItemFulfilmentLine, Guid, CreateItemFulfilmentLine, Guid>
    {
        public CreateItemFulfilmentLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        protected override async Task<ItemFulfilmentLine> CreateEntityAsync(CreateItemFulfilmentLine request, IMapper mapper, CancellationToken cancellationToken)
        {
            // Validate that the ItemFulfilment exists
            var itemFulfilmentExists = await DbContext.ItemFulfilments
                .AnyAsync(ifl => ifl.Id == request.DNID, cancellationToken);

            if (!itemFulfilmentExists)
            {
                throw new InvalidOperationException($"Item Fulfilment with ID '{request.DNID}' does not exist.");
            }

            // Create the entity using the base method
            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateItemFulfilmentLine, ItemFulfilmentLine> args)
        {
            return args.Entity.Id;
        }
    }
} 