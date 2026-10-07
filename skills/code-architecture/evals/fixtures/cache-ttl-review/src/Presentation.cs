namespace Social.Directory;

public static class RoomNameFormatter
{
    private const int MaxDisplayLength = 32;

    public static string Display(RoomListing listing)
    {
        var name = listing.Name.Trim();
        return name.Length <= MaxDisplayLength ? name : string.Concat(name.AsSpan(0, MaxDisplayLength - 1), "…");
    }
}

public static class DirectorySort
{
    public static IEnumerable<RoomListing> ByOccupancy(IEnumerable<RoomListing> listings) =>
        listings.OrderByDescending(l => l.Occupancy).ThenBy(l => l.Name, StringComparer.OrdinalIgnoreCase);
}
