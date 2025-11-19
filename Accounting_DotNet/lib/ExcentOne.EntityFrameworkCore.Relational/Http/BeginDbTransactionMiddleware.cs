using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Data;
using System.Reflection;

namespace ExcentOne.EntityFrameworkCore.Relational.Http;

[Obsolete("This is considered a leaky abstraction and will not be maintained anymore. Use ExcentOne.MediatR.EntityFrameworkCore BeginDbTransaction behaviour instead.")]
public class BeginDbTransactionMiddleware(
    IDbTransactionProvider dbTransactionProvider,
    IOptions<DbTransactionHttpRequestOptions> dbTransactionOptions,
    ILogger<BeginDbTransactionMiddleware> logger) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.RequestAborted.IsCancellationRequested)
        {
            return;
        }

        var endpoint = context.Features.Get<IEndpointFeature>()?.Endpoint;
        var attribute = endpoint?.Metadata.GetMetadata<BeginDbTransactionAttribute>()
            ?? endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>()?
                .ControllerTypeInfo.GetCustomAttribute<BeginDbTransactionAttribute>();

        if (attribute is null || attribute.IgnoreHttpMethods.Any(method => method.Method == context.Request.Method))
        {
            await next(context);
            return;
        }

        var isolationLevel = attribute.IsolationLevel ?? dbTransactionOptions.Value.IsolationLevel;
        IDbTransaction currentTransaction = default!;

        try
        {
            currentTransaction = await dbTransactionProvider.BeginTransactionAsync(context.RequestAborted);
            await next(context);
            currentTransaction.Commit();
        }
        catch (DbUpdateException ex)
        {
            currentTransaction.Rollback();
            logger.LogError("An error has occurred while committing the changes to the database.\r\n{StackTrace}", ex.StackTrace);
            throw;
        }
        finally
        {
            currentTransaction.Connection!.Close();
        }
    }
}
