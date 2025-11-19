using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetProductsByItemTypeHandler : IRequestHandler<GetProductsByItemType, IEnumerable<ProductResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetProductsByItemTypeHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ProductResultDto>> Handle(GetProductsByItemType request, CancellationToken cancellationToken)
        {
            var query = _dbContext.Products.AsQueryable();

            // Filter by ItemType
            query = query.Where(x => x.ItemType == request.ItemTypeId);

            // Filter by Active status
            query = query.Where(x => x.Inactive == false);

            // Add search text filter if provided
            if (!string.IsNullOrWhiteSpace(request.SearchText))
            {
                query = query.Where(x => EF.Functions.Like(x.ItemName, $"%{request.SearchText}%") || EF.Functions.Like(x.ItemCode, $"%{request.SearchText}%"));
            }

            // Apply sorting if provided
            if (request.Sorting != null && request.Sorting.Any())
            {
                var firstSort = request.Sorting.First();
                
                query = firstSort.Field.ToLower() switch
                {
                    "itemname" => firstSort.IsDescending ? query.OrderByDescending(x => x.ItemName) : query.OrderBy(x => x.ItemName),
                    "itemcode" => firstSort.IsDescending ? query.OrderByDescending(x => x.ItemCode) : query.OrderBy(x => x.ItemCode),
                    _ => query.OrderBy(x => x.ItemName)
                };
            }
            else
            {
                query = query.OrderBy(x => x.ItemName);
            }

            var products = await query
                .Include(x => x.PurchaseTaxCodeNavigation)
                .Include(x => x.SalesTaxCodeNavigation)
                .Include(x => x.ItemTypeNavigation)
                .Include(x => x.FormNavigation)
                .ToListAsync(cancellationToken);

            return products.Select(product =>
            {
                var result = _mapper.Map<ProductResultDto>(product);
                result.PurchaseTaxCodeName = product.PurchaseTaxCodeNavigation?.Name;
                result.SalesTaxCodeName = product.SalesTaxCodeNavigation?.Name;
                result.ItemTypeName = product.ItemTypeNavigation?.Name;
                result.FormName = product.FormNavigation?.FormName;
                return result;
            });
        }
    }
}
