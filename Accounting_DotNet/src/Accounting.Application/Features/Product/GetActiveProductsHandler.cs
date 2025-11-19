using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Features
{
    public class GetActiveProductsHandler : IRequestHandler<GetActiveProducts, List<ProductResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetActiveProductsHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<ProductResultDto>> Handle(GetActiveProducts request, CancellationToken cancellationToken)
        {
            // Get all active products (Inactive = false or null) without pagination
            var products = await _dbContext.Products
                .Include(x => x.ItemTypeNavigation)
                .Include(x => x.PurchaseTaxCodeNavigation)
                .Include(x => x.SalesTaxCodeNavigation)
                .Include(x => x.FormNavigation)
                .Where(x => x.Inactive == false || x.Inactive == null)
                .OrderBy(x => x.ItemName)
                .ToListAsync(cancellationToken);

            return products.Select(entity => {
                var result = _mapper.Map<ProductResultDto>(entity);
                result.ItemTypeName = entity.ItemTypeNavigation?.Name;
                result.PurchaseTaxCodeName = entity.PurchaseTaxCodeNavigation?.Name;
                result.SalesTaxCodeName = entity.SalesTaxCodeNavigation?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                return result;
            }).ToList();
        }
    }
}
