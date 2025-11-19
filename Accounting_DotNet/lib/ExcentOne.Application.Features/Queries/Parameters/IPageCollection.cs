namespace ExcentOne.Application.Features.Queries.Parameters;

public interface IPageCollection
{
    const int DefaultPageNumber = 1;
    const int DefaultPageSize = 10;

    int PageNumber { get; }
    int PageSize { get; }
}
