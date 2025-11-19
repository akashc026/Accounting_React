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
    public class GetItemReceiptHandler : GetEntityHandler<AccountingDbContext, ItemReceipt, Guid, GetItemReceipt, ItemReceiptResultDto>
    {
        public GetItemReceiptHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<ItemReceiptResultDto?> Handle(GetItemReceipt request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.Vendor)
                    .Include(x => x.PO)
                    .Include(x => x.Location)
                    .Include(x => x.FormNavigation)
                    .Include(x => x.StatusNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override ItemReceiptResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetItemReceipt, ItemReceipt?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<ItemReceiptResultDto>(entity);
            result.VendorName = entity.Vendor?.Name;
            result.LocationName = entity.Location?.Name;
            result.FormName = entity.FormNavigation?.FormName;
            result.StatusName = entity.StatusNavigation?.Name;
            
            return result;
        }
    }
} 
