using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace CloudSave;

/// <summary>One slot row from the server-published save manifest.</summary>
public sealed record SaveSlotEntry(string SlotId, long MaxBytes);

public enum ManifestStatus { Loaded, Missing, Invalid }

public sealed record ManifestLoadResult(ManifestStatus Status, IReadOnlyList<SaveSlotEntry> Slots)
{
    public static ManifestLoadResult Failed(ManifestStatus status) => new(status, Array.Empty<SaveSlotEntry>());
}

/// <summary>Loads the save manifest delivered with the profile response and owns the decision whether it is usable.</summary>
public static class SaveManifestLoader
{
    private const string Category = "SaveManifest";

    public static ManifestLoadResult Load(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            ServiceLog.Error(Category, "Save manifest missing; cloud sync disabled for this session.");
            return ManifestLoadResult.Failed(ManifestStatus.Missing);
        }

        List<SaveSlotEntry> entries;
        try
        {
            entries = JsonSerializer.Deserialize<List<SaveSlotEntry>>(json) ?? new List<SaveSlotEntry>();
        }
        catch (JsonException ex)
        {
            ServiceLog.Error(Category, "Save manifest unreadable; cloud sync disabled: " + ex.Message);
            return ManifestLoadResult.Failed(ManifestStatus.Invalid);
        }

        for (var i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];
            if (entry == null || string.IsNullOrEmpty(entry.SlotId) || entry.MaxBytes <= 0)
            {
                ServiceLog.Error(Category, $"Save manifest entry {i} lacks a slot id or size limit; cloud sync disabled.");
                return ManifestLoadResult.Failed(ManifestStatus.Invalid);
            }
        }
        return new ManifestLoadResult(ManifestStatus.Loaded, entries);
    }
}

public enum SlotStoreFault { CacheDirectoryUnavailable }

public sealed class SlotStoreException : Exception
{
    public SlotStoreFault Fault { get; }
    public SlotStoreException(SlotStoreFault fault) : base(fault.ToString()) => Fault = fault;
}

/// <summary>Local staging store for slot payloads. Needs a writable cache directory to exist.</summary>
public sealed class SlotStore
{
    private readonly Dictionary<string, SaveSlotEntry> _slots = new();

    public SlotStore(IReadOnlyList<SaveSlotEntry> slots, string cacheDirectory)
    {
        if (!Directory.Exists(cacheDirectory))
            throw new SlotStoreException(SlotStoreFault.CacheDirectoryUnavailable);
        foreach (var slot in slots)
            _slots[slot.SlotId] = slot;
    }

    public SaveSlotEntry Find(string slotId) => _slots.TryGetValue(slotId, out var slot) ? slot : null;
}
