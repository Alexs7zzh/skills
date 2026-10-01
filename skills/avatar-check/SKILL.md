---
name: avatar-check
description: Use when the user points to a .vrm or avatar file and asks to check, audit, inspect, shrink, compress, or optimize it, or asks why an avatar is too big, slow to load, rejected, or looks different in MEs.
---

# Avatar check

Check a VRM avatar file against what MEs loads, explain the result in plain words, and, only when asked, write an optimized copy.

## Mode

- **Read-only by default.** Do not write the user's file or anything beside it.
- **Write mode** only when the user asks for a change: "optimize this", "shrink it", "make it smaller", "fix it", or a yes to the closing question of a read-only report. "Check", "audit", "what's wrong", and "why is it big" stay read-only.
- The input file is never overwritten, in either mode.

## Tools

The skill needs Node 18 or newer and nothing else. `scripts/vrm-tool.mjs` carries its image codecs and the Khronos glTF validator in `scripts/vendor/`. If `node --version` fails or is below 18, stop, say what Node is for, and ask before installing: `brew install node` on macOS, `winget install OpenJS.NodeJS.LTS` on Windows.

Do not reach for other tools to write the file. `gltf-transform` drops `VRMC_vrm` and `VRMC_springBone` on write with only a warning, and the output is no longer an avatar.

## Steps

1. Run `node <skill-dir>/scripts/vrm-tool.mjs audit <file>`. It reads only and takes about a minute for a 30 MB file, because it measures every change in memory (`trials`). `--quick` skips the trials. Output: size breakdown, counts, validator errors, per-image facts, the MEs GPU texture estimate, `findings`, and `trials`.
2. If a finding needs more explanation, or the user asks why MEs behaves a certain way, read `references/mes-importer.md`.
3. Write the report below from the audit output. In read-only mode, end with the approval question.

## Changes

Recommend and apply changes only from this table.

| Change | Flag | Risk | What the user loses | Recommend |
|---|---|---|---|---|
| Merge duplicate texture entries | `--merge-textures` | None | Nothing. Same pixels, same look. | Always |
| Remove unused images and data | `--prune` | None | Nothing MEs or another app shows | Always |
| Recompress PNGs losslessly | `--png` | None | Nothing. Identical pixels. | Always |
| Use one copy of near-identical images | `--merge-similar` | Visual, tiny | Under 1% pixel difference on the merged texture | When found |
| Clamp material values to 0-1 | `--clamp-materials` | Visual change, usually a fix | The out-of-range look | When found; the user checks the look |
| Fill name, author, version | `--name`, `--author`, `--meta-version` | None | Nothing | When placeholder; the user supplies the text, never invent it |
| JPEG for opaque color textures | `--jpeg 95` | Visual, small loss; VRoid Hub lists PNG only | Slight detail; normal and data maps stay PNG | When over the size limit and the file must work in Unity-based apps. Read `references/webp-support.md` if the user publishes on VRoid Hub or BOOTH |
| WebP for all textures | `--webp 90` | Visual, small loss; **portability** | Missing textures in every Unity-based VRM app (VRChat, VSeeFace, Warudo) and on VRoid Hub, BOOTH previews, and cluster | When the file is for MEs only. Read `references/webp-support.md` before recommending it |
| Shrink large textures | `--max-side 1024` | **Visual regression** | Softer textures up close; GPU memory per 2048 px texture drops from 16.8 to 4.2 MB | Only when the user wants less memory and accepts softer textures |

`--safe` is `--merge-textures --prune --png`. Lossy rows report quality as PSNR: 40 dB or more is hard to see; below 35 dB is visible. Quote the lowest color and data values from the trial.

These need the creator's tools (Blender, VRoid, Unity). List the ones that apply; never attempt them:

- Over 70,000 triangles: decimate in Blender. Visual regression.
- Expressions that move nothing: bind them to face blendshapes. A fix for other apps; MEs does not animate faces yet.
- Removing blendshapes: saves file size and MEs ignores them today, but every other VRM app loses facial expressions. Recommend against unless the file is for MEs only.
- MToon materials: MEs renders the plain glTF material instead. Check that the fallback colors look acceptable.

## Report

The reader may not know glTF. Use the plain term first and the technical name in parentheses once: "blendshapes (morph targets)", "texture entries". Sizes come from the script in MB (1,000,000 bytes, as Finder shows). Every problem says what it costs the user and what fixes it.

```markdown
## <file name>: <one-line verdict>

**Loads in MEs:** Yes / No / Premium only: <reason in one sentence>
**Size:** <total> MB. Images <n> MB, mesh <n> MB, blendshapes <n> MB, other <n> MB.
**Memory in MEs:** about <n> MB of textures on the GPU for each avatar loaded.

### Stops it loading
<blocker findings; "Nothing." if none>

### Wasted space or memory
<cost and ignored findings, largest first>

### Looks different in MEs
<looks-different findings and validator errors; "Nothing found." if none>

### For other VRM apps
<other-apps findings>

### Changes
| Change | Result (measured) | Risk | Your call |
|---|---|---|---|
<rows from the Changes table that apply to this file, with trial numbers. "Your call" names the judgment, or "None" for no-risk rows>

Needs Blender or VRoid: <the creator-tool items that apply>

<Read-only: "Do you want me to write an optimized copy to <path> with <the recommended changes>?">
```

## Write mode

1. Choose flags. Default to `--safe` plus every row the user said yes to. If the user's goal, such as getting under the free limit, needs a lossy row, name the smallest one that meets it from the trials and ask first, unless they already accepted it.
2. Run `node <skill-dir>/scripts/vrm-tool.mjs optimize <file> <flags>`. Output defaults to `<name>.optimized.vrm` beside the input; MEs imports avatars only from `.vrm` files.
3. The script verifies before writing: VRM data, nodes, meshes, skins, and accessor bytes match the input, every image decodes, and every required extension is one MEs reads. If it exits 1, nothing was written; report `verify_problems`.
4. Report a before/after table of size, GPU memory, validator errors, and the lowest PSNR from `image_quality`.
5. Ask the user to import the new file in MEs and look at it before deleting the original. The script cannot render the avatar.
