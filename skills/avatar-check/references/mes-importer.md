# What the MEs importer does with a VRM

Read from the MEs `CommonImporter` source at `/main` cs:16360 (2026-10-01). `scripts/vrm-tool.mjs` encodes the rules marked *(script)*. If the importer changes, update both.

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
- PBR materials plus `KHR_materials_` unlit, specular, ior, anisotropy, emissive_strength, clearcoat, sheen, transmission, volume, pbrSpecularGlossiness. Out-of-range factors are passed through unclamped.

## Read but cut down *(script: `looks-different`)*

- MEs uses one material type per material, in this order: unlit, specular-glossiness, transmission/volume, clearcoat, sheen. Clearcoat plus sheen loses sheen. Transmission loses clearcoat, sheen, and emissive. Specular-glossiness loses specular, anisotropy, and ior. Unlit loses normal, occlusion, and emissive.
- Skin weights: `JOINTS_0`/`WEIGHTS_0` only, 4 influences per vertex.
- UV sets: `TEXCOORD_0` and `_1`. Vertex colors: `COLOR_0`. Skinned meshes always regenerate tangents.

## Ignored (still downloaded)

- Blendshapes (morph targets) and VRM expressions, lookAt, firstPerson. The avatar face does not animate in MEs yet.
- MToon (`VRMC_materials_mtoon`, VRM 0.x `materialProperties`). The plain glTF material renders instead, without outline, shade, rim, or matcap.
- `VRMC_materials_hdr_emissiveMultiplier`, animations, cameras, lights, the thumbnail and license metadata.

## Cost

- Every texture becomes uncompressed BGRA8 with one mip: 4 bytes per pixel. 1024² is 4.2 MB, 2048² is 16.8 MB on the GPU *(script)*.
- Images above 2048×2048 pixels of area are shrunk at decode. The extra pixels cost download and decode time only *(script)*.
- MEs decodes once per texture entry and usage (color, normal, data), not per image. Blender exports often write one texture entry per material slot, so one image decodes several times *(script: `duplicate-texture-entries`)*.
- Viewers download the file once per device and cache it. Parse, texture decode, and mesh build run again on every load.
