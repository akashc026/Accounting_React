using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Accounting.API.Filters
{
    public class JsonErrorFilter : IExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            if (context.ExceptionHandled)
            {
                return;
            }

            var statusCode = context.Exception switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                InvalidOperationException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };

            string errorMessage = context.Exception switch
            {
                DbUpdateException dbEx when dbEx.InnerException != null => dbEx.InnerException.Message,
                _ => context.Exception.Message
            };

            string payload = TryPassThroughJson(errorMessage) ??
                             JsonSerializer.Serialize(new
                             {
                                 allow = false,
                                 error = errorMessage
                             });

            context.Result = new ContentResult
            {
                StatusCode = statusCode,
                ContentType = "application/json",
                Content = payload
            };

            context.ExceptionHandled = true;
        }

        private static string? TryPassThroughJson(string message)
        {
            try
            {
                using var _ = JsonDocument.Parse(message);
                return message;
            }
            catch
            {
                return null;
            }
        }
    }
}
