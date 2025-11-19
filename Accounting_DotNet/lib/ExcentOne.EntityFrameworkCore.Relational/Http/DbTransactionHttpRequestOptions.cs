using System.Data;

namespace ExcentOne.EntityFrameworkCore.Relational.Http;

[Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
public class DbTransactionHttpRequestOptions(IDbTransactionHttpRequestSettings source) : IDbTransactionHttpRequestSettings
{
    public static readonly DbTransactionHttpRequestOptions Default = new()
    {
        IsolationLevel = IDbTransactionHttpRequestSettings.DefaultIsolationLevel,
        IgnoreHttpMethods = IDbTransactionHttpRequestSettings.DefaultIgnoreHttpMethods
    };

    public DbTransactionHttpRequestOptions() : this(Default)
    {
    }

    public IsolationLevel? IsolationLevel { get; init; } = source.IsolationLevel;
    public ICollection<HttpMethod> IgnoreHttpMethods { get; init; } = source.IgnoreHttpMethods;
}
