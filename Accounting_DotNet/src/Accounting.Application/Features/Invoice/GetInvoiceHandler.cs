using Accounting.Persistence;
using Accounting.Persistence.Models;
using ExcentOne.Application.Features.Queries;
using ExcentOne.MediatR.EntityFrameworkCore.Query;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetInvoiceHandler : GetEntityHandler<AccountingDbContext, Invoice, Guid, GetInvoice, InvoiceResultDto>
    {
        public GetInvoiceHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<InvoiceResultDto?> Handle(GetInvoice request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.StatusNavigation)
                    .Include(x => x.Customer)
                    .Include(x => x.FormNavigation)
                    .Include(x => x.Location)
                    .Include(x => x.DN)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override InvoiceResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInvoice, Invoice?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<InvoiceResultDto>(entity);
            result.StatusName = entity.StatusNavigation?.Name;
            result.CustomerName = entity.Customer?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            result.LocationName = entity.Location?.Name;
            result.DNSequenceNumber = entity.DN?.SequenceNumber;

            return result;
        }
    }
}