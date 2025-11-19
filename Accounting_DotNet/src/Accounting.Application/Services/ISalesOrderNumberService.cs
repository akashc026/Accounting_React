using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Services
{
    public interface ISalesOrderNumberService
    {
        Task<string> GenerateSalesOrderNumberAsync(CancellationToken cancellationToken = default);
    }
} 