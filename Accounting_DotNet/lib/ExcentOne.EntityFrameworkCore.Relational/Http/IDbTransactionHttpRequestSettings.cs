using System.Data;

namespace ExcentOne.EntityFrameworkCore.Relational.Http;

[Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
public interface IDbTransactionHttpRequestSettings
{
    const IsolationLevel DefaultIsolationLevel = System.Data.IsolationLevel.ReadCommitted;
    static readonly ICollection<HttpMethod> DefaultIgnoreHttpMethods = [HttpMethod.Get];

    IsolationLevel? IsolationLevel { get; }
    ICollection<HttpMethod> IgnoreHttpMethods { get; }
}
