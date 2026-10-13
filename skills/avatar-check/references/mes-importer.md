# What the MEs importer does with a VRM

Baseline read from the MEs `CommonImporter` source at `/main` cs:16360 (2026-10-01). Material selection, sampler handling and texture sharing rechecked against `/main` on 2026-10-13, including released cs:16513–16519; DoF checked against cs:16535. `scripts/vrm-tool.mjs` encodes the rules marked *(script)*. If the importer changes, update both.

## Rejected (the avatar does not load)

- File over 25 MiB on a free account or 100 MiB on premium *(script)*. The avatar import button in `W_M_ProfileView` runs `ValidatePatchFilesQuick`, the same check as placing a patch in a world, before it calls `ImportAvatar`. Oversized files get the upload-failure dialog. `ImportAvatar` itself and the backend do not check size. 25 MiB is 26.2 MB as Finder shows it.
- No skin, no `VRMC_vrm` or `VRM` extension, or a VRM 1.0 file without `meta.name` *(script)*.
- A required humanoid bone is unmapped: hips, spine, head, and both upper leg, lower leg, foot, upper arm, lower arm, hand *(script)*. Chest and neck are optional.
- Bad humanoid hierarchy, duplicate bone slots, or an invalid `VRMC_node_constraint`. The script does not check these.
- More than 70,000 triangles, or more than 256 bones after MEs drops bones that are not humanoid, spring, or constraint bones *(script, raw joint count only)*.
- An extension in `extensionsRequired` that MEs does not support, any `EXT_meshopt_compression` data, external buffer files *(script)*.
- KTX2 images (`KHR_texture_basisu`) without a PNG/JPEG fallback load as missing textures. External image files load as missing textures *(script)*.

## Read and applied

- VRM 0.x and 1.0. VRM 1.0 wins if both are present.
- Spring bones: `VRMC_springBone`, `VRMC_springBone_extended_collider`, VRM 0.x `secondaryAnimation`. `VRMC_node_constraint`.
- Images: PNG, JPEG, WebP (`EXT_texture_webp` is preferred over the fallback image), GIF, HEIF.
- `KHR_texture_transform`, `KHR_mesh_quantization` (normalized integers only), `KHR_draco_mesh_compression`.
- PBR materials plus `KHR_materials_` unlit, specular, ior, anisotropy, emissive_strength, clearcoat, sheen, transmission, volume, pbrSpecularGlossiness. Finite out-of-range factors are passed through unclamped. They can intentionally create the authored look; keeping them is fine in MEs, though other apps may clamp them or render them differently.
- Texture magnification set to nearest keeps pixel-art textures crisp. MEs has one filter per texture, so that nearest choice also applies at a distance. Specular-color textures keep their own wrap and filter settings.
- Blended Default and ClearCoat materials render before depth of field and participate in its blur (cs:16535). Other material families keep their previous pass. This does not change texture memory or mean every avatar looks different; focus and background affect the result.

## Read but cut down *(script: `looks-different`)*

- MEs uses one material type per material, in this order: unlit, specular-glossiness, effective transmission, effective clearcoat, effective sheen, plain PBR. Transmission and clearcoat require a finite factor above 0; sheen requires a finite color component above 0. A volume block alone or a zero transmission factor does not select transmission. Zero clearcoat does not suppress active sheen.
- Active clearcoat takes priority over sheen. Transmission loses clearcoat, sheen, anisotropy, and emissive. Specular-glossiness loses specular, anisotropy, and ior. Unlit loses normal, occlusion, and emissive.
- Skin weights: `JOINTS_0`/`WEIGHTS_0` only, 4 influences per vertex.
- UV sets: `TEXCOORD_0` and `_1`. Vertex colors: `COLOR_0`. Skinned meshes always regenerate tangents.

## Ignored (still downloaded)

- Blendshapes (morph targets) and VRM expressions, lookAt, firstPerson. The avatar face does not animate in MEs yet.
- MToon (`VRMC_materials_mtoon`, VRM 0.x `materialProperties`). The plain glTF material renders instead, without outline, shade, rim, or matcap.
- `VRMC_materials_hdr_emissiveMultiplier`, animations, cameras, lights, the thumbnail and license metadata.

## Cost

- Every texture becomes uncompressed BGRA8 with one mip: 4 bytes per pixel. 1024² is 4.2 MB, 2048² is 16.8 MB on the GPU *(script)*.
- Images above 2048×2048 pixels of area are shrunk at decode. The extra pixels cost download and decode time only *(script)*.
- MEs shares texture entries with the same image, effective sampler settings and usage (color, normal, data). Different sampler indices can share if their effective settings match; different usage types still decode separately *(script)*.
- `--merge-textures` makes material slots share an existing duplicate texture reference. It may slightly reduce JSON size, but does not remove image data or reduce MEs decodes or GPU memory. Treat it as optional file cleanup and use the trial's measured file size *(script: `duplicate-texture-entries`)*.
- Viewers download the file once per device and cache it. Parse, texture decode, and mesh build run again on every load.
