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
    public class CreateProductHandler : CreateEntityHandler<AccountingDbContext, Product, Guid, CreateProduct, Guid>
    {
        private readonly IFormSequenceService _formSequenceService;

        public CreateProductHandler(AccountingDbContext dbContext, IMapper mapper, IFormSequenceService formSequenceService)
            : base(dbContext, mapper)
        {
            _formSequenceService = formSequenceService;
        }

        protected override async Task<Product> CreateEntityAsync(CreateProduct request, IMapper mapper, CancellationToken cancellationToken)
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

        protected override void OnEntityCreated(CreateProduct request, Product entity)
        {
            base.OnEntityCreated(request, entity);
        }

        protected override Guid OnCommandSuccess(DbCommandSuccessArgs<CreateProduct, Product> args)
        {
            return args.Entity.Id;
        }
    }
} 