using Accounting.Persistence;
using Accounting.Persistence.Models;
using MapsterMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Accounting.Application.Features
{
    public class GetInvoicesByCustLocHandler : IRequestHandler<GetInvoicesByCustLoc, List<InvoiceResultDto>>
    {
        private readonly AccountingDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetInvoicesByCustLocHandler(AccountingDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
        }

        public async Task<List<InvoiceResultDto>> Handle(GetInvoicesByCustLoc request, CancellationToken cancellationToken)
        {
            var query = _dbContext.Invoices
                .Include(x => x.Customer)
                .Include(x => x.Location)
                .Include(x => x.FormNavigation)
                .Include(x => x.DN)
                .Include(x => x.StatusNavigation)
                .Where(x => x.CustomerID == request.CustomerId)
                .Where(x => x.LocationID == request.LocationId)
                .Where(x => x.StatusNavigation != null && x.StatusNavigation.Name == "Open");

            var invoices = await query.ToListAsync(cancellationToken);

            return invoices.Select(entity => {
                var result = _mapper.Map<InvoiceResultDto>(entity);
                result.CustomerName = entity.Customer?.Name;
                result.LocationName = entity.Location?.Name;
                result.FormName = entity.FormNavigation?.FormName;
                result.DNSequenceNumber = entity.DN?.SequenceNumber;
                return result;
            }).ToList();
        }
    }
}
