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
    public class CreateInventoryTransferHandler : CreateEntityHandler<AccountingDbContext, InventoryTransfer, Guid, CreateInventoryTransfer, Guid>
    {
        private readonly IFormSequenceService _formSequenceService;

        public CreateInventoryTransferHandler(AccountingDbContext dbContext, IMapper mapper, IFormSequenceService formSequenceService)
            : base(dbContext, mapper)
        {
            _formSequenceService = formSequenceService;
        }

        protected override async Task<InventoryTransfer> CreateEntityAsync(CreateInventoryTransfer request, IMapper mapper, CancellationToken cancellationToken)
        {
            // Always generate sequence number on backend to prevent concurrency issues
            // Even if frontend provides one, we ignore it and generate server-side
            request.SequenceNumber = await _formSequenceService.GenerateNextSequenceNumberAsync(request.Form, cancellationToken);

            // Map to entity after setting sequence number
            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateInventoryTransfer, InventoryTransfer> args)
        {
            return args.Entity.Id;
        }
    }
}

