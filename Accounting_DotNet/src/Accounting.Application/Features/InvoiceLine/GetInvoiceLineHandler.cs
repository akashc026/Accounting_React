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
    public class GetInvoiceLineHandler : GetEntityHandler<AccountingDbContext, InvoiceLine, Guid, GetInvoiceLine, InvoiceLineResultDto>
    {
        public GetInvoiceLineHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<InvoiceLineResultDto?> Handle(GetInvoiceLine request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.INID)
                    .Include(x => x.Item)
                    .Include(x => x.Tax)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override InvoiceLineResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetInvoiceLine, InvoiceLine?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<InvoiceLineResultDto>(entity);
            
            // Calculate TaxAmount based on TaxPercent and line total
            if (entity.TaxPercent > 0)
            {
                result.TaxAmount = (entity.TotalAmount * entity.TaxPercent) / 100;
            }
            else
            {
                result.TaxAmount = 0;
            }
            
            return result;
        }
    }
} 