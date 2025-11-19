namespace ExcentOne.Application.Features.Results;

public class PaginatedList<T>
{
    public required IEnumerable<T> Results { get; init; }
    public required int PageSize { get; init; }
    public required int CurrentPage { get; init; }
    public required long TotalItems { get; init; }
}
