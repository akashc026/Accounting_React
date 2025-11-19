using System;
using System.Threading;
using System.Threading.Tasks;

namespace Accounting.Application.Services
{
    public interface IFormSequenceService
    {
        /// <summary>
        /// Generates the next sequence number for a specific form in a thread-safe manner
        /// </summary>
        /// <param name="formId">The form ID to generate sequence for</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Formatted sequence number with prefix (e.g., "CUST0001")</returns>
        Task<string> GenerateNextSequenceNumberAsync(Guid formId, CancellationToken cancellationToken = default);
    }
}
