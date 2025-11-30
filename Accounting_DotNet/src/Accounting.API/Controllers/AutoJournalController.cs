using System.Threading;
using System.Threading.Tasks;
using Accounting.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Accounting.API.Controllers;

public sealed class AutoJournalResponse
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
}

[ApiController]
[Route("api/journal")]
public class AutoJournalController : ControllerBase
{
    private readonly IJournalGenerationService _journalGenerationService;

    public AutoJournalController(IJournalGenerationService journalGenerationService)
    {
        _journalGenerationService = journalGenerationService;
    }

    [HttpPost]
    public async Task<ActionResult<AutoJournalResponse>> GenerateAndProcess([FromBody] GenerateJvRequest request, CancellationToken ct)
    {
        var result = await _journalGenerationService.ProcessAsync(request, ct);
        if (!result.IsValid)
        {
            return BadRequest(new AutoJournalResponse
            {
                IsValid = false,
                Message = result.ErrorMessage ?? "Failed to create journal."
            });
        }

        return Ok(new AutoJournalResponse
        {
            IsValid = true,
            Message = "Successfully created"
        });
    }


    [HttpPost("preview")]
    public async Task<ActionResult<GenerateJvResult>> Preview([FromBody] GenerateJvRequest request, CancellationToken ct)
    {
        var result = await _journalGenerationService.GenerateAsync(request, ct);
        if (!result.IsValid)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
