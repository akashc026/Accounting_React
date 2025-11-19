using System.Data;

namespace ExcentOne.EntityFrameworkCore.Relational.Http;

[Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
public class BeginDbTransactionAttribute : Attribute, IDbTransactionHttpRequestSettings
{
    public IsolationLevel? IsolationLevel { get; set; }
    public ICollection<HttpMethod> IgnoreHttpMethods { get; set; } = [];
}