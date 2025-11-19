namespace ExcentOne.Application.Features.Queries.Parameters;

public interface ISortCollection
{
    IEnumerable<SortParameter> Sorting { get; }
}

public class SortParameter
{
    public string Field { get; init; } = default!;
    public bool IsDescending { get; init; }
    public int? Order { get; set; }
}
