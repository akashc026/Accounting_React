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
    public class GetProductHandler : GetEntityHandler<AccountingDbContext, Product, Guid, GetProduct, ProductResultDto>
    {
        public GetProductHandler(AccountingDbContext dbContext, IMapper mapper) : base(dbContext, mapper)
        {
        }

        public override async Task<ProductResultDto?> Handle(GetProduct request, CancellationToken cancellationToken)
        {
            return await ExecuteQueryAsync(async (req, token) =>
            {
                var entity = await Entities
                    .Include(x => x.PurchaseTaxCodeNavigation)
                    .Include(x => x.SalesTaxCodeNavigation)
                    .Include(x => x.ItemTypeNavigation)
                    .Include(x => x.FormNavigation)
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
                    
                return new(request, entity, entity is null ? 0 : 1);
            }, request, cancellationToken);
        }

        protected override ProductResultDto? OnQuerySuccess(DbQuerySuccessArgs<GetProduct, Product?> args)
        {
            var entity = args.Result;
            if (entity == null) return null;
            
            var result = Mapper.Map<ProductResultDto>(entity);
            result.PurchaseTaxCodeName = entity.PurchaseTaxCodeNavigation?.Name;
            result.SalesTaxCodeName = entity.SalesTaxCodeNavigation?.Name;
            result.ItemTypeName = entity.ItemTypeNavigation?.Name;
            result.FormName = entity.FormNavigation?.FormName;

            return result;
        }
    }
} 