using System;
using System.Collections.Generic;
using System.Text.Json;

namespace RoomSync;

/// <summary>One region row from the server-published catalog.</summary>
public sealed record RegionCatalogEntry(string Code, string Endpoint, int Port);

/// <summary>Loads the region catalog delivered with the login response.</summary>
public static class RegionCatalogLoader
{
    public static IReadOnlyList<RegionCatalogEntry> Load(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Array.Empty<RegionCatalogEntry>();
        try
        {
            var entries = JsonSerializer.Deserialize<List<RegionCatalogEntry>>(json);
            return entries ?? new List<RegionCatalogEntry>();
        }
        catch (JsonException ex)
        {
            ServiceLog.Warning("RegionCatalog", "Region catalog could not be parsed: " + ex.Message);
            return Array.Empty<RegionCatalogEntry>();
        }
    }
}

/// <summary>Resolved connection target for one region.</summary>
public sealed class RegionEndpoint
{
    public string Code { get; }
    public Uri Address { get; }

    public RegionEndpoint(RegionCatalogEntry entry)
    {
        if (string.IsNullOrEmpty(entry.Code))
            throw new ArgumentException("Region entry has no code.");
        if (string.IsNullOrEmpty(entry.Endpoint) || entry.Port <= 0)
            throw new ArgumentException($"Region '{entry.Code}' has no usable endpoint.");
        Code = entry.Code;
        Address = new UriBuilder("wss", entry.Endpoint, entry.Port).Uri;
    }
}
