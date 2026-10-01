#!/usr/bin/env node
// Audit a VRM avatar against the MEs importer, or write an optimized copy.
// Needs Node 18+ only. Codecs and the Khronos glTF validator are bundled in vendor/.
//
//   node vrm-tool.mjs audit <file.vrm> [--quick]
//   node vrm-tool.mjs optimize <file.vrm> [changes] [-o out.vrm] [--force]
//
// The MEs rules mirror CommonImporter; references/mes-importer.md cites each one.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as C from './vendor/codecs.mjs';

const VENDOR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor');

// ---------- MEs importer rules ----------

const SUPPORTED_EXT = new Set([
  'EXT_texture_webp', 'KHR_texture_transform', 'KHR_mesh_quantization',
  'KHR_draco_mesh_compression', 'KHR_materials_ior', 'KHR_materials_unlit',
  'KHR_materials_sheen', 'KHR_materials_volume', 'KHR_materials_specular',
  'KHR_materials_clearcoat', 'KHR_materials_anisotropy',
  'KHR_materials_transmission', 'KHR_materials_emissive_strength',
  'KHR_materials_pbrSpecularGlossiness', 'VRMC_node_constraint', 'VRMC_vrm',
  'VRM', 'VRMC_springBone', 'VRMC_springBone_extended_collider',
]);
const VRM_ROOT_EXT = ['VRMC_vrm', 'VRM', 'VRMC_springBone', 'VRMC_node_constraint'];
const REQUIRED_BONES = [
  'hips', 'spine', 'head',
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot',
  'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand',
];
const MAX_TRIANGLES = 70_000;
const MAX_BONES = 256;
const SOFT_TEXTURE_PIXELS = 2048 * 2048;
const MIB = 1024 * 1024; // MEs file limits are in MiB.
const FILE_CAP_FREE = 25 * MIB;
const FILE_CAP_PREMIUM = 100 * MIB;
const PLACEHOLDER_META = new Set(['', 'undefined', 'null', 'none', 'untitled', 'unknown']);
// glTF slot -> MEs decode usage. Each (texture entry, usage) pair is one decode.
const SLOT_USAGE = {
  baseColorTexture: 'color', diffuseTexture: 'color', specularGlossinessTexture: 'color',
  emissiveTexture: 'color', sheenColorTexture: 'color', specularColorTexture: 'color',
  normalTexture: 'normal', clearcoatNormalTexture: 'normal',
};
// Material factors with a [0, 1] range in the glTF spec. Arrays clamp per component.
const UNIT_FACTORS = [
  ['pbrMetallicRoughness', 'metallicFactor'], ['pbrMetallicRoughness', 'roughnessFactor'],
  ['pbrMetallicRoughness', 'baseColorFactor'], ['emissiveFactor'],
  ['occlusionTexture', 'strength'],
  ['extensions', 'KHR_materials_sheen', 'sheenColorFactor'], ['extensions', 'KHR_materials_sheen', 'sheenRoughnessFactor'],
  ['extensions', 'KHR_materials_anisotropy', 'anisotropyStrength'],
  ['extensions', 'KHR_materials_clearcoat', 'clearcoatFactor'], ['extensions', 'KHR_materials_clearcoat', 'clearcoatRoughnessFactor'],
  ['extensions', 'KHR_materials_specular', 'specularFactor'],
  ['extensions', 'KHR_materials_transmission', 'transmissionFactor'],
];
const SIMILAR_RMSE = 0.01; // below 1% RMSE, two images count as the same picture

// ---------- GLB ----------

function fail(msg) { console.error(`error: ${msg}`); process.exit(2); }

function readGlb(file) {
  const data = fs.readFileSync(file);
  if (data.toString('latin1', 0, 4) !== 'glTF') fail(`${file} is not a binary glTF/VRM file (no 'glTF' header)`);
  let off = 12, js = null, bin = Buffer.alloc(0);
  while (off < data.length) {
    const len = data.readUInt32LE(off), kind = data.toString('latin1', off + 4, off + 8);
    const chunk = data.subarray(off + 8, off + 8 + len);
    if (kind === 'JSON') js = JSON.parse(chunk.toString('utf8'));
    else if (kind === 'BIN\0') bin = chunk;
    off += 8 + len;
  }
  return { js, bin, bytes: data };
}

function buildGlb(js, bin) {
  let j = Buffer.from(JSON.stringify(js), 'utf8');
  j = Buffer.concat([j, Buffer.alloc((4 - j.length % 4) % 4, 0x20)]);
  const b = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const head = Buffer.alloc(12);
  head.write('glTF', 0, 'latin1'); head.writeUInt32LE(2, 4);
  const parts = [head, chunkHeader(j.length, 'JSON'), j];
  if (b.length) parts.push(chunkHeader(b.length, 'BIN\0'), b);
  const out = Buffer.concat(parts);
  out.writeUInt32LE(out.length, 8);
  return out;
}

function chunkHeader(len, kind) {
  const h = Buffer.alloc(8);
  h.writeUInt32LE(len, 0); h.write(kind, 4, 'latin1');
  return h;
}

function viewBytes(js, bin, vi) {
  const v = js.bufferViews[vi], start = v.byteOffset ?? 0;
  return bin.subarray(start, start + v.byteLength);
}

function imageBytes(js, bin, i) {
  const im = js.images[i];
  return im.bufferView !== undefined ? viewBytes(js, bin, im.bufferView) : null;
}

function sniffImage(b) {
  if (!b) return { format: 'external', width: 0, height: 0 };
  if (b.readUInt32BE(0) === 0x89504e47) return { format: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      const marker = b[i + 1], seg = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xc2) return { format: 'jpeg', width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + seg;
    }
    return { format: 'jpeg', width: 0, height: 0 };
  }
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const kind = b.toString('latin1', 12, 16);
    if (kind === 'VP8X') return { format: 'webp', width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') { const bits = b.readUInt32LE(21); return { format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8 ') return { format: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (b.subarray(0, 12).equals(Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { format: 'ktx2', width: b.readUInt32LE(20), height: b.readUInt32LE(24) };
  return { format: 'unknown', width: 0, height: 0 };
}

function mesDecodeSize(w, h) {
  if (w * h <= SOFT_TEXTURE_PIXELS) return [w, h];
  const s = Math.sqrt(SOFT_TEXTURE_PIXELS / (w * h));
  let nw = Math.max(1, Math.floor(w * s)), nh = Math.max(1, Math.floor(h * s));
  if (nw >= 4) nw -= nw % 4;
  if (nh >= 4) nh -= nh % 4;
  return [nw, nh];
}

const textureImage = t => t.extensions?.EXT_texture_webp?.source ?? t.source;
const clone = o => JSON.parse(JSON.stringify(o));
const mb = n => Math.round(n / 1e5) / 10;

function* materialTextureRefs(o) {
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && k.endsWith('Texture') && Number.isInteger(v.index)) yield [k, v];
    else yield* materialTextureRefs(v);
  }
}

// Texture slots MEs reads, following its one-material-type priority.
function mesMaterialSlots(m) {
  const ext = m.extensions ?? {}, pbr = m.pbrMetallicRoughness ?? {};
  if (ext.KHR_materials_unlit) return [['baseColorTexture', pbr.baseColorTexture]].filter(s => s[1]);
  const slots = [['normalTexture', m.normalTexture], ['occlusionTexture', m.occlusionTexture]];
  const transmissive = ext.KHR_materials_transmission || ext.KHR_materials_volume;
  if (!transmissive) slots.push(['emissiveTexture', m.emissiveTexture]);
  const sg = ext.KHR_materials_pbrSpecularGlossiness;
  if (sg) slots.push(['diffuseTexture', sg.diffuseTexture], ['specularGlossinessTexture', sg.specularGlossinessTexture]);
  else {
    slots.push(['baseColorTexture', pbr.baseColorTexture], ['metallicRoughnessTexture', pbr.metallicRoughnessTexture]);
    const sp = ext.KHR_materials_specular ?? {};
    slots.push(['specularTexture', sp.specularTexture], ['specularColorTexture', sp.specularColorTexture]);
    slots.push(['anisotropyTexture', ext.KHR_materials_anisotropy?.anisotropyTexture]);
  }
  if (transmissive) slots.push(['transmissionTexture', ext.KHR_materials_transmission?.transmissionTexture], ['thicknessTexture', ext.KHR_materials_volume?.thicknessTexture]);
  else if (ext.KHR_materials_clearcoat) for (const k of ['clearcoatTexture', 'clearcoatNormalTexture', 'clearcoatRoughnessTexture']) slots.push([k, ext.KHR_materials_clearcoat[k]]);
  else if (ext.KHR_materials_sheen) for (const k of ['sheenColorTexture', 'sheenRoughnessTexture']) slots.push([k, ext.KHR_materials_sheen[k]]);
  return slots.filter(s => s[1]);
}

function droppedMaterialFeatures(m) {
  const ext = new Set(Object.keys(m.extensions ?? {})), lost = [];
  if (ext.has('KHR_materials_unlit')) {
    for (const k of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) if (m[k]) lost.push(k);
    for (const e of ext) if (e !== 'KHR_materials_unlit') lost.push(e);
  } else if (ext.has('KHR_materials_pbrSpecularGlossiness')) {
    for (const e of ['KHR_materials_specular', 'KHR_materials_anisotropy', 'KHR_materials_ior']) if (ext.has(e)) lost.push(e);
  }
  if (ext.has('KHR_materials_transmission') || ext.has('KHR_materials_volume')) {
    for (const e of ['KHR_materials_clearcoat', 'KHR_materials_sheen']) if (ext.has(e)) lost.push(e);
    if (m.emissiveTexture || m.emissiveFactor?.some(v => v)) lost.push('emissive');
  } else if (ext.has('KHR_materials_clearcoat') && ext.has('KHR_materials_sheen')) lost.push('KHR_materials_sheen');
  return lost;
}

function vrmInfo(js) {
  const ext = js.extensions ?? {};
  if (ext.VRMC_vrm) {
    const v = ext.VRMC_vrm, meta = v.meta ?? {}, ex = v.expressions ?? {};
    const exprs = [...Object.values(ex.preset ?? {}), ...Object.values(ex.custom ?? {})];
    return {
      version: '1.0', bones: new Set(Object.keys(v.humanoid?.humanBones ?? {})),
      meta: { name: meta.name, authors: meta.authors, version: meta.version },
      thumbImage: meta.thumbnailImage, expressions: exprs.length,
      expressionBinds: exprs.reduce((n, e) => n + (e.morphTargetBinds?.length ?? 0), 0),
      mtoon: (js.extensionsUsed ?? []).includes('VRMC_materials_mtoon'),
    };
  }
  if (ext.VRM) {
    const v = ext.VRM, meta = v.meta ?? {}, groups = v.blendShapeMaster?.blendShapeGroups ?? [];
    const thumbTex = meta.texture;
    return {
      version: '0.x', bones: new Set((v.humanoid?.humanBones ?? []).map(b => b.bone)),
      meta: { name: meta.title, authors: meta.author, version: meta.version },
      thumbImage: Number.isInteger(thumbTex) && js.textures?.[thumbTex] ? textureImage(js.textures[thumbTex]) : undefined,
      expressions: groups.length, expressionBinds: groups.reduce((n, g) => n + (g.binds?.length ?? 0), 0),
      mtoon: (v.materialProperties ?? []).some(p => String(p.shader ?? '').startsWith('VRM/MToon')),
    };
  }
  return null;
}

// GPU bytes of the BGRA8 one-mip textures MEs creates, and the decode count.
function gpuCost(js, bin, { merged = false } = {}) {
  const textures = js.textures ?? [], keys = new Map();
  const usedMeshes = new Set((js.nodes ?? []).filter(n => n.mesh !== undefined).map(n => n.mesh));
  const usedMats = new Set();
  for (const mi of usedMeshes) for (const p of js.meshes[mi].primitives) if (p.material !== undefined) usedMats.add(p.material);
  for (const mi of usedMats) for (const [slot, info] of mesMaterialSlots(js.materials[mi])) {
    const t = textures[info.index], img = textureImage(t);
    const key = `${merged ? `${img}/${t.sampler}` : info.index}|${SLOT_USAGE[slot] ?? 'data'}`;
    keys.set(key, img);
  }
  let total = 0;
  for (const img of keys.values()) {
    if (img === undefined) continue;
    const { width, height } = sniffImage(imageBytes(js, bin, img));
    const [w, h] = mesDecodeSize(width, height);
    total += w * h * 4;
  }
  return { decodes: keys.size, gpu_mb: mb(total) };
}

// ---------- images ----------

let codecsReady = null;
const encodeCache = new Map(); // trials re-encode the same image with the same settings

function codecs() {
  const load = name => WebAssembly.compile(fs.readFileSync(path.join(VENDOR, name)));
  codecsReady ??= Promise.all([
    load('squoosh_png_bg.wasm').then(m => C.initPngDecode(m).then(() => C.initPngEncode(m))),
    load('mozjpeg_dec.wasm').then(C.initJpegDecode), load('mozjpeg_enc.wasm').then(C.initJpegEncode),
    load('webp_dec.wasm').then(C.initWebpDecode), load('webp_enc.wasm').then(C.initWebpEncode),
    load('squoosh_resize_bg.wasm').then(C.initResize), load('squoosh_oxipng_bg.wasm').then(C.initPngOptimise),
  ]);
  return codecsReady;
}

const arrayBuffer = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

async function decodeImage(b) {
  await codecs();
  const { format } = sniffImage(b);
  if (format === 'png') return C.decodePng(arrayBuffer(b));
  if (format === 'jpeg') return C.decodeJpeg(arrayBuffer(b));
  if (format === 'webp') return C.decodeWebp(arrayBuffer(b));
  return null;
}

function isOpaque(img) {
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] !== 255) return false;
  return true;
}

function rgbError(a, b) {
  let se = 0;
  for (let i = 0; i < a.data.length; i += 4) for (let c = 0; c < 3; c++) { const d = a.data[i + c] - b.data[i + c]; se += d * d; }
  return se / (a.data.length / 4 * 3);
}
const psnr = (a, b) => { const e = rgbError(a, b); return e === 0 ? Infinity : Math.round(10 * Math.log10(65025 / e) * 10) / 10; };
const rmse = (a, b) => Math.sqrt(rgbError(a, b)) / 255;

function imageRoles(js) {
  const textures = js.textures ?? [], roles = new Map();
  for (const m of js.materials ?? []) for (const [slot, info] of materialTextureRefs(m)) {
    const img = textureImage(textures[info.index]);
    if (!roles.has(img)) roles.set(img, new Set());
    roles.get(img).add(slot);
  }
  return roles;
}

// ---------- changes ----------

function mergeTextures(js) {
  const first = new Map(); let changed = 0;
  const key = t => JSON.stringify([textureImage(t), t.sampler, t.extensions ?? {}]);
  (js.textures ?? []).forEach((t, i) => { if (!first.has(key(t))) first.set(key(t), i); });
  for (const m of js.materials ?? []) for (const [, info] of materialTextureRefs(m)) {
    const target = first.get(key(js.textures[info.index]));
    if (target !== info.index) { info.index = target; changed++; }
  }
  return changed ? [`merge-textures: ${changed} material slots now share an existing texture entry`] : [];
}

function similarPairs(js, decoded, thumbImage) {
  const pairs = [], used = new Set(), ids = [...decoded.keys()].filter(i => i !== thumbImage);
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const A = decoded.get(ids[a]), B = decoded.get(ids[b]);
    if (used.has(ids[b]) || A.width !== B.width || A.height !== B.height) continue;
    const r = rmse(A, B);
    if (r < SIMILAR_RMSE) { pairs.push({ keep: ids[a], drop: ids[b], rmse: Math.round(r * 10000) / 100 }); used.add(ids[b]); }
  }
  return pairs;
}

function mergeSimilar(js, pairs) {
  const log = [];
  for (const { keep, drop, rmse: r } of pairs) {
    for (const t of js.textures ?? []) {
      if (t.source === drop) t.source = keep;
      if (t.extensions?.EXT_texture_webp?.source === drop) t.extensions.EXT_texture_webp.source = keep;
    }
    log.push(`merge-similar: image ${drop} '${js.images[drop].name ?? ''}' replaced by image ${keep} (${r}% different)`);
  }
  return log;
}

// Remove images no texture entry or thumbnail uses, then bufferViews nothing uses.
function pruneUnused(js) {
  const log = [], ext = js.extensions ?? {};
  const usedImages = new Set();
  for (const t of js.textures ?? []) {
    if (t.source !== undefined) usedImages.add(t.source);
    for (const e of Object.values(t.extensions ?? {})) if (Number.isInteger(e?.source)) usedImages.add(e.source);
  }
  if (Number.isInteger(ext.VRMC_vrm?.meta?.thumbnailImage)) usedImages.add(ext.VRMC_vrm.meta.thumbnailImage);
  const remap = new Map(); const kept = [];
  (js.images ?? []).forEach((im, i) => {
    if (usedImages.has(i)) { remap.set(i, kept.length); kept.push(im); }
    else log.push(`prune: removed unused image ${i} '${im.name ?? ''}'`);
  });
  if (kept.length !== (js.images ?? []).length) {
    js.images = kept;
    for (const t of js.textures ?? []) {
      if (t.source !== undefined) t.source = remap.get(t.source);
      for (const e of Object.values(t.extensions ?? {})) if (Number.isInteger(e?.source)) e.source = remap.get(e.source);
    }
    if (Number.isInteger(ext.VRMC_vrm?.meta?.thumbnailImage)) ext.VRMC_vrm.meta.thumbnailImage = remap.get(ext.VRMC_vrm.meta.thumbnailImage);
  }
  // Every glTF reference to a bufferView uses the key "bufferView"; VRM JSON uses none.
  const refs = [], walk = o => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
      if (k === 'bufferView' && Number.isInteger(v)) refs.push([o, v]); else walk(v);
    }
  };
  walk({ ...js, bufferViews: undefined });
  const usedViews = new Set(refs.map(r => r[1]));
  const viewMap = new Map(); const keptViews = [];
  (js.bufferViews ?? []).forEach((v, i) => { if (usedViews.has(i)) { viewMap.set(i, keptViews.length); keptViews.push(i); } });
  for (const [o, v] of refs) o.bufferView = viewMap.get(v);
  return { log, keptViews };
}

function clampMaterials(js) {
  const log = [];
  (js.materials ?? []).forEach((m, mi) => {
    for (const p of UNIT_FACTORS) {
      const parent = p.slice(0, -1).reduce((o, k) => o?.[k], m), key = p[p.length - 1];
      if (!parent || parent[key] === undefined) continue;
      const before = parent[key];
      const after = Array.isArray(before) ? before.map(v => Math.min(1, Math.max(0, v))) : Math.min(1, Math.max(0, before));
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        parent[key] = after;
        log.push(`clamp: material ${mi} '${m.name ?? ''}' ${p.join('.')} ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
      }
    }
  });
  return log;
}

function setMeta(js, { name, author, version }) {
  const log = [], v1 = js.extensions?.VRMC_vrm, v0 = js.extensions?.VRM;
  const meta = v1 ? (v1.meta ??= {}) : v0 ? (v0.meta ??= {}) : fail('no VRM meta to edit');
  const keys = v1 ? { name: 'name', author: 'authors', version: 'version' } : { name: 'title', author: 'author', version: 'version' };
  for (const [k, val] of Object.entries({ name, author, version })) {
    if (val === undefined) continue;
    meta[keys[k]] = k === 'author' && v1 ? [val] : val;
    log.push(`meta: ${keys[k]} = ${JSON.stringify(meta[keys[k]])}`);
  }
  return log;
}

async function reencodeImages(js, bin, keptViews, opts, decoded) {
  await codecs();
  const log = [], quality = [], newViews = new Map();
  const info = vrmInfo(js), roles = imageRoles(js);
  // Lossy codecs subsample chroma, which blurs normal directions and packed R/G/B data
  // channels. Only images used purely as color get lossy encoding.
  const colorImages = new Set([...roles].filter(([, s]) => [...s].every(k => SLOT_USAGE[k] === 'color')).map(([i]) => i));
  for (const [i, im] of (js.images ?? []).entries()) {
    const b = imageBytes(js, bin, i);
    if (!b || i === info?.thumbImage) continue;
    const { format, width, height } = sniffImage(b);
    if (!['png', 'jpeg', 'webp'].includes(format)) continue;
    const src = decoded.get(im.__orig ?? i) ?? await decodeImage(b);
    const shrink = opts.maxSide && Math.max(width, height) > opts.maxSide;
    let target = format;
    if (opts.webp) target = 'webp';
    else if (opts.jpeg && format === 'png' && colorImages.has(i) && isOpaque(src)) target = 'jpeg';
    if (target === format && !shrink && !(opts.png && format === 'png')) continue;
    let img = src;
    if (shrink) {
      const s = opts.maxSide / Math.max(width, height);
      img = await C.resize(src, { width: Math.max(1, Math.round(width * s)), height: Math.max(1, Math.round(height * s)), method: 'lanczos3' });
    }
    const cacheKey = crypto.createHash('sha1').update(b).digest('hex') + JSON.stringify([target, img.width, opts.webp, opts.jpeg, opts.png, colorImages.has(i)]);
    let out = encodeCache.get(cacheKey);
    if (out) {
      // Same image and settings as an earlier trial.
    } else if (target === 'webp') {
      const o = opts.webp === 'lossless' ? { lossless: 1, method: 4 }
        : !colorImages.has(i) ? { lossless: 1, near_lossless: 60, method: 4 }
        : { quality: Number(opts.webp), method: 4, use_sharp_yuv: 1, alpha_quality: 100, exact: 1 };
      out = Buffer.from(await C.encodeWebp(img, o));
    } else if (target === 'jpeg') {
      out = Buffer.from(await C.encodeJpeg(img, { quality: Number(opts.jpeg ?? 95), chroma_subsample: 1 }));
    } else {
      const raw = shrink ? await C.encodePng(img) : arrayBuffer(b);
      out = opts.png ? Buffer.from(await C.optimisePng(raw, { level: 1, interlace: false, optimiseAlpha: false })) : Buffer.from(raw);
    }
    encodeCache.set(cacheKey, out);
    if (out.length >= b.length && !shrink) continue;
    const back = await decodeImage(out);
    const q = psnr(img, back);
    newViews.set(im.bufferView, out);
    im.mimeType = { webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' }[target];
    quality.push({ image: i, name: im.name ?? '', color: colorImages.has(i), psnr_db: q });
    log.push(`image ${i} '${im.name ?? ''}': ${format} ${width}x${height} ${mb(b.length)} MB -> ${target}${shrink ? ` ${img.width}x${img.height}` : ''} ${mb(out.length)} MB, ${q === Infinity ? 'lossless' : `${q} dB`}`);
  }
  if (opts.webp) {
    const webpImages = new Set(js.images.map((im, i) => im.mimeType === 'image/webp' ? i : -1));
    for (const t of js.textures ?? []) if (webpImages.has(t.source)) { t.extensions ??= {}; t.extensions.EXT_texture_webp = { source: t.source }; delete t.source; }
    for (const key of ['extensionsUsed', 'extensionsRequired']) if (!(js[key] ??= []).includes('EXT_texture_webp')) js[key].push('EXT_texture_webp');
  }
  return { log, quality, newViews };
}

// Apply changes to a copy and return the new file bytes. Never writes to disk.
async function applyChanges(src, opts, decoded = new Map()) {
  const js = clone(src.js), log = [];
  if (opts.clampMaterials) log.push(...clampMaterials(js));
  if (opts.name !== undefined || opts.author !== undefined || opts.version !== undefined) log.push(...setMeta(js, opts));
  if (opts.mergeSimilar) {
    const info = vrmInfo(js);
    for (const [i] of (js.images ?? []).entries()) if (!decoded.has(i)) decoded.set(i, await decodeImage(imageBytes(js, src.bin, i)));
    log.push(...mergeSimilar(js, similarPairs(js, new Map([...decoded].filter(([, d]) => d)), info?.thumbImage)));
  }
  if (opts.mergeTextures) log.push(...mergeTextures(js));
  // Keep original indices on images so decoded pixels can be reused after pruning.
  (js.images ?? []).forEach((im, i) => { Object.defineProperty(im, '__orig', { value: i, enumerable: false }); });
  const views = js.bufferViews.map((_, vi) => viewBytes(src.js, src.bin, vi));
  const { log: pruneLog, keptViews } = opts.prune ? pruneUnused(js) : { log: [], keptViews: js.bufferViews.map((_, i) => i) };
  log.push(...pruneLog);
  js.bufferViews = keptViews.map(i => js.bufferViews[i]);
  const keptBytes = keptViews.map(i => views[i]);
  // Pack once so image reads see the pruned layout.
  let bin = pack(js, keptBytes, new Map());
  let quality = [];
  if (opts.webp || opts.jpeg || opts.maxSide || opts.png) {
    const r = await reencodeImages(js, bin, keptViews, opts, decoded);
    log.push(...r.log); quality = r.quality;
    bin = pack(js, js.bufferViews.map((_, vi) => viewBytes(js, bin, vi)), r.newViews);
  }
  return { js, bin, bytes: buildGlb(js, bin), log, quality };
}

function pack(js, chunks, replace) {
  const parts = []; let off = 0;
  js.bufferViews.forEach((v, vi) => {
    const pad = (4 - off % 4) % 4;
    if (pad) { parts.push(Buffer.alloc(pad)); off += pad; }
    const c = replace.get(vi) ?? chunks[vi];
    v.byteOffset = off; v.byteLength = c.length;
    parts.push(c); off += c.length;
  });
  if (js.buffers?.length) js.buffers[0].byteLength = off + (4 - off % 4) % 4;
  return Buffer.concat(parts);
}

// ---------- verification ----------

async function verify(before, after, opts) {
  const problems = [], a = before.js, b = after.js;
  for (const key of VRM_ROOT_EXT) {
    const x = clone(a.extensions?.[key] ?? null), y = clone(b.extensions?.[key] ?? null);
    if (opts.metaChanged && x?.meta) { delete x.meta; delete y.meta; }
    if (opts.prune && key === 'VRMC_vrm' && x?.meta) { delete x.meta?.thumbnailImage; delete y.meta?.thumbnailImage; }
    if (JSON.stringify(x) !== JSON.stringify(y)) problems.push(`root extension ${key} changed`);
  }
  for (const key of ['nodes', 'meshes', 'skins', 'scenes', 'scene', 'animations', 'samplers'])
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) problems.push(`${key} changed`);
  (a.accessors ?? []).forEach((acc, i) => {
    const acc2 = b.accessors?.[i];
    const strip = o => JSON.stringify({ ...o, bufferView: undefined, sparse: undefined });
    if (!acc2 || strip(acc) !== strip(acc2)) return problems.push(`accessor ${i} changed`);
    if (acc.bufferView !== undefined && !viewBytes(a, before.bin, acc.bufferView).equals(viewBytes(b, after.bin, acc2.bufferView)))
      problems.push(`accessor ${i} data changed`);
  });
  if ((a.materials ?? []).length !== (b.materials ?? []).length) problems.push('material count changed');
  for (const [i, t] of (b.textures ?? []).entries()) {
    const img = textureImage(t);
    if (img === undefined || !b.images?.[img]) { problems.push(`texture ${i} points at no image`); continue; }
  }
  for (const [i] of (b.images ?? []).entries()) {
    const bytes = imageBytes(b, after.bin, i);
    const dec = bytes && await decodeImage(bytes).catch(() => null);
    if (!dec?.width) problems.push(`image ${i} does not decode`);
  }
  for (const e of b.extensionsRequired ?? []) if (!SUPPORTED_EXT.has(e)) problems.push(`extensionsRequired lists ${e}, which MEs rejects`);
  return problems;
}

// ---------- validation ----------

async function validate(bytes) {
  const rep = await C.validateBytes(new Uint8Array(bytes), { maxIssues: 0 });
  const errors = {};
  for (const m of rep.issues.messages) {
    if (m.severity !== 0) continue;
    (errors[m.code] ??= { code: m.code, count: 0, examples: [] }).count++;
    if (errors[m.code].examples.length < 30) errors[m.code].examples.push(`${m.pointer}: ${m.message}`);
  }
  return { errors: rep.issues.numErrors, warnings: rep.issues.numWarnings, error_codes: Object.values(errors) };
}

// ---------- audit ----------

async function audit(file, { quick }) {
  const src = readGlb(file), { js, bin, bytes } = src, F = [];
  const add = (group, key, text, extra = {}) => F.push({ group, key, text, ...extra });
  const accessors = js.accessors ?? [], views = js.bufferViews ?? [];
  const accBytes = i => {
    const a = accessors[i]; let n = a.bufferView !== undefined ? views[a.bufferView].byteLength : 0;
    if (a.sparse) n += views[a.sparse.indices.bufferView].byteLength + views[a.sparse.values.bufferView].byteLength;
    return n;
  };

  let geometry = 0, morphs = 0, tris = 0, extraBytes = 0; const extraAttrs = new Set();
  for (const mesh of js.meshes ?? []) for (const p of mesh.primitives) {
    for (const t of p.targets ?? []) for (const a of Object.values(t)) morphs += accBytes(a);
    for (const a of Object.values(p.attributes)) geometry += accBytes(a);
    if (p.indices !== undefined) geometry += accBytes(p.indices);
    if ((p.mode ?? 4) === 4) tris += Math.floor(accessors[p.indices ?? p.attributes.POSITION].count / 3);
    for (const [name, a] of Object.entries(p.attributes)) {
      const [, base, idx] = name.match(/^([A-Z]+)_(\d+)$/) ?? [];
      const ignored = (base === 'TEXCOORD' && +idx >= 2) || (base === 'COLOR' && +idx >= 1)
        || ((base === 'JOINTS' || base === 'WEIGHTS') && +idx >= 1) || (name === 'TANGENT' && p.attributes.JOINTS_0 !== undefined);
      if (ignored) { extraAttrs.add(name); extraBytes += accBytes(a); }
    }
  }
  let animations = 0;
  for (const an of js.animations ?? []) for (const s of an.samplers ?? []) animations += accBytes(s.input) + accBytes(s.output);
  const imagesTotal = (js.images ?? []).reduce((n, _, i) => n + (imageBytes(js, bin, i)?.length ?? 0), 0);

  // Loading.
  const info = vrmInfo(js);
  if (!info) add('blocker', 'no-vrm', 'No VRM extension (VRMC_vrm or VRM). MEs rejects it as an avatar.');
  else {
    if (info.version === '1.0' && !String(info.meta.name ?? '').trim()) add('blocker', 'meta-name', 'VRM 1.0 file has no meta.name. MEs rejects it.');
    const missing = REQUIRED_BONES.filter(b => !info.bones.has(b));
    if (missing.length) add('blocker', 'missing-bones', `Required humanoid bones not mapped: ${missing.join(', ')}.`);
  }
  if (!js.skins?.length) add('blocker', 'no-skin', 'No skin. MEs needs a skinned mesh for an avatar.');
  if (tris > MAX_TRIANGLES) add('blocker', 'triangles', `${tris.toLocaleString('en')} triangles. MEs rejects avatars above ${MAX_TRIANGLES.toLocaleString('en')}.`);
  const joints = Math.max(0, ...(js.skins ?? []).map(s => s.joints.length));
  if (joints > MAX_BONES) add('limit', 'bones', `The skin lists ${joints} joints. MEs keeps only humanoid, spring, and constraint bones and rejects more than ${MAX_BONES} kept bones.`);
  for (const e of js.extensionsRequired ?? []) if (!SUPPORTED_EXT.has(e)) add('blocker', 'required-ext', `extensionsRequired lists ${e}, which MEs does not support. MEs rejects the file.`);
  if (views.some(v => v.extensions?.EXT_meshopt_compression)) add('blocker', 'meshopt', 'Uses EXT_meshopt_compression. MEs rejects meshopt-compressed files.');
  for (const [i, im] of (js.images ?? []).entries()) if (im.uri && !im.uri.startsWith('data:')) add('blocker', 'external-image', `Image ${i} points to an external file. MEs only reads embedded images.`);
  if (bytes.length > FILE_CAP_PREMIUM)
    add('blocker', 'file-cap', `File is ${mb(bytes.length)} MB. MEs refuses avatar imports and world placement above ${mb(FILE_CAP_PREMIUM)} MB (its "100 MB" limit counts 1 MB as 1,048,576 bytes) for every account.`);
  else if (bytes.length > FILE_CAP_FREE)
    add('blocker', 'file-cap', `File is ${mb(bytes.length)} MB. Free accounts cannot import it as an avatar or place it in a world: the limit is ${mb(FILE_CAP_FREE)} MB (MEs calls it "25 MB" and counts 1 MB as 1,048,576 bytes). Premium accounts can, up to ${mb(FILE_CAP_PREMIUM)} MB.`, { free_tier_only: true, over_by_mb: mb(bytes.length - FILE_CAP_FREE) });

  // Look and other apps.
  if (info?.mtoon) add('looks-different', 'mtoon', 'Materials use MToon (toon shading). MEs ignores MToon and renders the plain glTF material, so outlines, shade color, rim light, and matcap are lost.');
  for (const e of js.extensionsUsed ?? []) if (!SUPPORTED_EXT.has(e) && e !== 'VRMC_materials_mtoon') add('ignored', 'ext-ignored', `${e} is listed but MEs ignores it.`);
  (js.materials ?? []).forEach((m, mi) => {
    const lost = droppedMaterialFeatures(m);
    if (lost.length) add('looks-different', 'material-feature', `Material ${mi} '${m.name ?? ''}': MEs drops ${lost.join(', ')}.`);
  });
  const clampPreview = clampMaterials(clone(js));
  if (clampPreview.length) add('looks-different', 'out-of-range', `${clampPreview.length} material settings are outside the glTF 0-1 range. MEs passes them through unclamped, so those surfaces can look too shiny, too rough, or glowing.`, { values: clampPreview.map(l => l.replace(/^clamp: /, '')), fix: 'clamp-materials' });
  if (info) {
    const text = v => String(Array.isArray(v) ? v[0] ?? '' : v ?? '').trim().toLowerCase();
    const ph = Object.entries(info.meta).filter(([, v]) => PLACEHOLDER_META.has(text(v))).map(([k]) => k);
    if (ph.length) add('other-apps', 'meta-placeholder', `Meta fields empty or placeholder: ${ph.join(', ')}. VRM apps and stores show these as the avatar's name and author.`, { fields: ph, fix: 'set-meta' });
    if (info.expressions && !info.expressionBinds) add('other-apps', 'empty-expressions', `${info.expressions} expressions are defined but none moves a blendshape, so the face cannot blink or talk in other VRM apps.`);
  }
  if (morphs) add('ignored', 'morphs', `Blendshapes (morph targets) take ${mb(morphs)} MB. MEs does not import blendshapes yet; other VRM apps use them for the face.`, { bytes: morphs });
  if (animations) add('ignored', 'animations', `Animations take ${mb(animations)} MB. MEs ignores them.`, { bytes: animations });
  if (extraAttrs.size) add('ignored', 'attributes', `Vertex data MEs discards: ${[...extraAttrs].sort().join(', ')} (${mb(extraBytes)} MB).`, { bytes: extraBytes });

  // Images.
  const roles = imageRoles(js), textures = js.textures ?? [], images = [], decoded = new Map();
  for (const [i, im] of (js.images ?? []).entries()) {
    const b = imageBytes(js, bin, i), s = sniffImage(b);
    const dec = ['png', 'jpeg', 'webp'].includes(s.format) ? await decodeImage(b).catch(() => null) : null;
    if (dec) decoded.set(i, dec);
    const [dw, dh] = mesDecodeSize(s.width, s.height);
    images.push({ index: i, name: im.name ?? '', format: s.format, width: s.width, height: s.height, mb: mb(b?.length ?? 0), opaque: dec ? isOpaque(dec) : null, slots: [...(roles.get(i) ?? [])].sort(), thumbnail: i === info?.thumbImage });
    if (s.format === 'ktx2') add('blocker', 'ktx2', `Image ${i} is KTX2. MEs cannot decode KTX2 and the texture goes missing.`);
    else if (!dec && b) add('blocker', 'image-format', `Image ${i} is in a format MEs cannot decode.`);
    if (dw !== s.width || dh !== s.height) add('ignored', 'oversize-image', `Image ${i} '${im.name ?? ''}' is ${s.width}x${s.height}. MEs shrinks it to ${dw}x${dh}, so the extra pixels only add download size.`);
    if (!roles.has(i) && i !== info?.thumbImage) add('cost', 'unused-image', `Image ${i} '${im.name ?? ''}' is not used by any material (${mb(b?.length ?? 0)} MB).`, { fix: 'prune' });
    if (i === info?.thumbImage) add('ignored', 'thumbnail', `Thumbnail is ${s.width}x${s.height}, ${mb(b?.length ?? 0)} MB. MEs does not show it; other VRM apps and stores do.`);
  }
  const now = gpuCost(js, bin), merged = gpuCost(js, bin, { merged: true });
  if (merged.decodes < now.decodes) {
    const count = new Map();
    for (const t of textures) count.set(textureImage(t), (count.get(textureImage(t)) ?? 0) + 1);
    const repeats = [...count].filter(([, n]) => n > 1).sort((x, y) => y[1] - x[1]).map(([i, n]) => `${js.images[i]?.name || i} x${n}`).join(', ');
    add('cost', 'duplicate-texture-entries', `${textures.length} texture entries point at ${count.size} images, because the exporter wrote a separate entry for each material that uses an image (${repeats}). MEs decodes each entry separately: ${now.decodes} textures, about ${now.gpu_mb} MB of GPU memory. Merged: ${merged.decodes} textures, about ${merged.gpu_mb} MB. The avatar looks the same.`, { fix: 'merge-textures' });
  }
  for (const p of similarPairs(js, decoded, info?.thumbImage))
    add('cost', 'similar-images', `Images ${p.keep} '${js.images[p.keep].name ?? ''}' and ${p.drop} '${js.images[p.drop].name ?? ''}' are the same picture (${p.rmse}% different). Keeping one saves ${mb(imageBytes(js, bin, p.drop).length)} MB of file and one texture on the GPU.`, { fix: 'merge-similar', ...p });

  const validation = await validate(bytes);

  // Trials: apply each change in memory and measure. Nothing is written.
  const trials = [];
  if (!quick) {
    const runs = [
      ['safe', { mergeTextures: true, prune: true, png: true }],
      ['safe + merge-similar', { mergeTextures: true, prune: true, png: true, mergeSimilar: true }],
      ['safe + clamp-materials', { mergeTextures: true, prune: true, png: true, clampMaterials: true }],
      ['safe + jpeg 95', { mergeTextures: true, prune: true, png: true, jpeg: 95 }],
      ['safe + webp 90', { mergeTextures: true, prune: true, webp: 90 }],
      ['safe + webp 90 + max-side 1024', { mergeTextures: true, prune: true, webp: 90, maxSide: 1024 }],
    ];
    for (const [label, opts] of runs) {
      process.stderr.write(`trial: ${label}...\n`);
      const r = await applyChanges(src, opts, decoded);
      const lossy = r.quality.filter(q => q.psnr_db !== Infinity);
      const g = gpuCost(r.js, r.bin);
      trials.push({
        label, mb_after: mb(r.bytes.length), gpu_mb_after: g.gpu_mb, under_free_cap: r.bytes.length <= FILE_CAP_FREE,
        lowest_psnr_color_db: lossy.some(q => q.color) ? Math.min(...lossy.filter(q => q.color).map(q => q.psnr_db)) : null,
        lowest_psnr_data_db: lossy.some(q => !q.color) ? Math.min(...lossy.filter(q => !q.color).map(q => q.psnr_db)) : null,
        validator_errors: (await validate(r.bytes)).errors,
      });
    }
  }

  return {
    file: path.resolve(file), mb: mb(bytes.length), generator: js.asset?.generator, vrm_version: info?.version ?? null,
    meta: info?.meta ?? {}, extensions_used: js.extensionsUsed ?? [], extensions_required: js.extensionsRequired ?? [],
    breakdown_mb: { images: mb(imagesTotal), geometry: mb(geometry), blendshapes: mb(morphs), animations: mb(animations), json: mb(JSON.stringify(js).length) },
    counts: { triangles: tris, skin_joints: joints, humanoid_bones: info?.bones.size ?? 0, meshes: js.meshes?.length ?? 0, materials: js.materials?.length ?? 0, textures: textures.length, images: images.length, expressions: info?.expressions ?? 0, springs: js.extensions?.VRMC_springBone?.springs?.length ?? 0 },
    mes_textures: { ...now, gpu_mb_if_merged: merged.gpu_mb },
    validation, images, findings: F, trials,
  };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const [cmd, input, ...rest] = argv, opts = { cmd, input };
  const flags = { '--merge-textures': 'mergeTextures', '--prune': 'prune', '--png': 'png', '--merge-similar': 'mergeSimilar', '--clamp-materials': 'clampMaterials', '--force': 'force', '--quick': 'quick' };
  const values = { '-o': 'output', '--output': 'output', '--webp': 'webp', '--jpeg': 'jpeg', '--max-side': 'maxSide', '--name': 'name', '--author': 'author', '--meta-version': 'version' };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--safe') Object.assign(opts, { mergeTextures: true, prune: true, png: true });
    else if (flags[a]) opts[flags[a]] = true;
    else if (values[a] && i + 1 < rest.length) opts[values[a]] = rest[++i];
    else fail(`unknown option ${a}`);
  }
  if (opts.maxSide) opts.maxSide = Number(opts.maxSide);
  if (opts.webp && opts.jpeg) fail('choose one of --webp and --jpeg');
  return opts;
}

const USAGE = `usage:
  node vrm-tool.mjs audit <file.vrm> [--quick]
  node vrm-tool.mjs optimize <file.vrm> [changes] [-o out.vrm] [--force]
changes:
  --safe              same as --merge-textures --prune --png
  --merge-textures    material slots that use the same image share one texture entry
  --prune             remove images and buffer data nothing uses
  --png               recompress PNGs losslessly (oxipng)
  --merge-similar     replace an image with a near-identical one (<1% different)
  --clamp-materials   clamp material factors to the glTF 0-1 range
  --webp <q|lossless> re-encode textures as WebP; normal and data maps near-lossless; adds EXT_texture_webp as required
  --jpeg <q>          re-encode opaque PNG color textures as JPEG (4:4:4); normal and data maps stay PNG
  --max-side <px>     shrink images whose longest side is above this
  --name, --author, --meta-version <text>   set VRM meta fields`;

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!['audit', 'optimize'].includes(opts.cmd) || !opts.input) { console.error(USAGE); process.exit(2); }
  if (opts.cmd === 'audit') return console.log(JSON.stringify(await audit(opts.input, opts), null, 1));

  const changeKeys = ['mergeTextures', 'prune', 'png', 'mergeSimilar', 'clampMaterials', 'webp', 'jpeg', 'maxSide', 'name', 'author', 'version'];
  if (!changeKeys.some(k => opts[k] !== undefined)) fail('choose at least one change; run without arguments for the list');
  const out = opts.output ?? opts.input.replace(/\.[^./\\]+$/, '') + '.optimized.vrm';
  if (path.resolve(out) === path.resolve(opts.input)) fail('output must differ from the input');
  if (fs.existsSync(out) && !opts.force) fail(`${out} exists; pass --force to replace it`);
  if (!out.toLowerCase().endsWith('.vrm')) fail('output must end in .vrm; MEs imports avatars only from .vrm files');

  const src = readGlb(opts.input);
  const r = await applyChanges(src, opts);
  const after = { js: r.js, bin: r.bin };
  const problems = await verify(src, after, { metaChanged: ['name', 'author', 'version'].some(k => opts[k] !== undefined), prune: opts.prune });
  const before = gpuCost(src.js, src.bin), now = gpuCost(r.js, r.bin);
  const [vb, va] = [await validate(src.bytes), await validate(r.bytes)];
  if (!problems.length) fs.writeFileSync(out, r.bytes);
  console.log(JSON.stringify({
    output: problems.length ? null : path.resolve(out),
    mb_before: mb(src.bytes.length), mb_after: mb(r.bytes.length),
    gpu_mb_before: before.gpu_mb, gpu_mb_after: now.gpu_mb, decodes_before: before.decodes, decodes_after: now.decodes,
    validator_errors_before: vb.errors, validator_errors_after: va.errors,
    changes: r.log, image_quality: r.quality, verify_problems: problems,
  }, null, 1));
  if (problems.length) process.exit(1);
}

main().catch(e => { console.error(e.stack ?? String(e)); process.exit(2); });
