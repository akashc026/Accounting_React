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
    public class CreateCreditMemoHandler : CreateEntityHandler<AccountingDbContext, CreditMemo, Guid, CreateCreditMemo, Guid>
    {
        private readonly IFormSequenceService _formSequenceService;

        public CreateCreditMemoHandler(AccountingDbContext dbContext, IMapper mapper, IFormSequenceService formSequenceService)
            : base(dbContext, mapper)
        {
            _formSequenceService = formSequenceService;
        }

        protected override async Task<CreditMemo> CreateEntityAsync(CreateCreditMemo request, IMapper mapper, CancellationToken cancellationToken)
        {
            // Always generate sequence number on backend to prevent concurrency issues
            // Even if frontend provides one, we ignore it and generate server-side
            request.SequenceNumber = await _formSequenceService.GenerateNextSequenceNumberAsync(request.Form, cancellationToken);

            // Map to entity after setting sequence number
            return await base.CreateEntityAsync(request, mapper, cancellationToken);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateCreditMemo, CreditMemo> args)
        {
            return args.Entity.Id;
        }
    }
}
