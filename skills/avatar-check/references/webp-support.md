# WebP and JPEG textures on other VRM platforms

Researched 2026-10-01 from public docs, changelogs, and source. "Inferred" means read from code or a dependency, not from a published rule or a test upload.

`--webp` writes `EXT_texture_webp` as required, with no PNG fallback. MEs reads it. Outside the three.js, Blender 4, and Godot ecosystems, almost nothing does. Every Unity-based VRM app depends on UniVRM, and no UniVRM release reads WebP. UniVRM does not reject the file; it loads it and the textures are missing.

| Platform | WebP | JPEG | What the user sees with WebP |
|---|---|---|---|
| VRoid Hub | No | No (docs list PNG only) | Upload rejected or broken preview; the docs do not say which |
| BOOTH | Preview: no | Preview: no | The 3D preview is an embedded VRoid Hub model. Selling the file works, but buyers' tools break as below |
| cluster | No | Yes (docs list PNG and JPG) | Unknown: upload rejection or missing textures |
| VRChat (Unity: UniVRM, then a converter) | No | Yes | Untextured materials, uploaded that way (inferred) |
| VSeeFace (UniVRM 0.89) | No | Yes | Blank or wrong textures; every WebP texture may show image 0 (inferred) |
| VMagicMirror, Warudo (UniVRM 0.130+) | No | Yes | Untextured materials (inferred) |
| Virtual Cast | Likely no | Yes | Untextured materials (inferred; UniVRM-based) |
| Resonite | Unknown | Yes | Depends on its bundled Assimp; older versions show missing textures (inferred) |
| VRM4U (Unreal) | No | Yes | Missing textures (inferred) |
| three.js and three-vrm web viewers | Yes | Yes | Works |
| Blender 4.0+ glTF importer | Yes | Yes | Works. Blender 3.x refuses the file |
| VRM Add-on for Blender | Partial | Yes | Imports, but MToon texture slots stay empty (inferred) |
| Godot 4.1+ with godot-vrm | Yes | Yes | Works |

The VRM 1.0 spec requires the thumbnail to be PNG or JPEG. The script never re-encodes the thumbnail.

Sources: UniVRM `ImporterContext.cs` and `GltfTextureImporter.cs` (vrm-c/UniVRM main, v0.131.3); help.cluster.mu article 360029465811; vroid.pixiv.help articles 360014798094 and 360014961134; vroid.com news 202003271300; VSeeFace release notes gist; VMagicMirror changelog v5.0.0; three.js `GLTFLoader.js`; Blender 4.0 add-on release notes; Godot PR #76895; glTFast issue #716; vrm-specification `VRMC_vrm-1.0/meta.md`.
