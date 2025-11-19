using Accounting.Application.Services;
using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Commands;
using ExcentOne.MediatR.EntityFrameworkCore.Command;
using MapsterMapper;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class CreateItemFulfilmentHandler : CreateEntityHandler<AccountingDbContext, ItemFulfilment, Guid, CreateItemFulfilment, Guid>
    {
        private readonly IFormSequenceService _formSequenceService;

        public CreateItemFulfilmentHandler(AccountingDbContext dbContext, IMapper mapper, IFormSequenceService formSequenceService)
            : base(dbContext, mapper)
        {
            _formSequenceService = formSequenceService;
        }

        protected override async Task<ItemFulfilment> CreateEntityAsync(CreateItemFulfilment request, IMapper mapper, CancellationToken cancellationToken)
        {
            // Always generate sequence number on backend to prevent concurrency issues
            // Even if frontend provides one, we ignore it and generate server-side
            if (request.Form.HasValue)
            {
                request.SequenceNumber = await _formSequenceService.GenerateNextSequenceNumberAsync(request.Form.Value, cancellationToken);
            }

            // Map to entity after setting sequence number
            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateItemFulfilment, ItemFulfilment> args)
        {
            return args.Entity.Id;
        }
    }
} 