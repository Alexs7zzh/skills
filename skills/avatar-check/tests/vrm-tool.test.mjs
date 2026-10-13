import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import * as C from '../scripts/vendor/codecs.mjs';

const skill = fileURLToPath(new URL('../', import.meta.url));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'avatar-check-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
const pngModule = await WebAssembly.compile(fs.readFileSync(path.join(skill, 'scripts/vendor/squoosh_png_bg.wasm')));
await C.initPngEncode(pngModule);
const png = Buffer.from(await C.encodePng({ width: 1024, height: 1024, data: new Uint8ClampedArray(1024 * 1024 * 4).fill(255) }));
const bones = ['hips', 'spine', 'head', 'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand'];
let sequence = 0;

function fixture(materials, textures = [{ source: 0 }], samplers) {
  const js = {
    asset: { version: '2.0' }, buffers: [{ byteLength: png.length }],
    bufferViews: [{ buffer: 0, byteLength: png.length }], images: [{ bufferView: 0, mimeType: 'image/png' }],
    textures, samplers, materials,
    accessors: [{ componentType: 5126, count: 1, type: 'VEC3', min: [0, 0, 0], max: [0, 0, 0] }],
    meshes: [{ primitives: materials.map((_, material) => ({ attributes: { POSITION: 0 }, mode: 0, material })) }],
    nodes: [{ mesh: 0 }, ...bones.map(name => ({ name }))], skins: [{ joints: bones.map((_, i) => i + 1) }],
    scenes: [{ nodes: [0] }], scene: 0,
    extensionsUsed: ['VRMC_vrm', ...new Set(materials.flatMap(m => Object.keys(m.extensions ?? {})))],
    extensions: { VRMC_vrm: { specVersion: '1.0', meta: { name: 'Fixture', authors: ['Test'], version: '1' }, humanoid: { humanBones: Object.fromEntries(bones.map((b, i) => [b, { node: i + 1 }])) } } },
  };
  const json = Buffer.from(JSON.stringify(js));
  const chunks = [[json, 'JSON', 0x20], [png, 'BIN\0', 0]].map(([data, type, fill]) => {
    const padded = Buffer.concat([data, Buffer.alloc((4 - data.length % 4) % 4, fill)]);
    const header = Buffer.alloc(8); header.writeUInt32LE(padded.length); header.write(type, 4, 'latin1');
    return Buffer.concat([header, padded]);
  });
  const header = Buffer.alloc(12); header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + chunks.reduce((n, c) => n + c.length, 0), 8);
  const input = path.join(scratch, `${sequence++}.vrm`);
  fs.writeFileSync(input, Buffer.concat([header, ...chunks]));
  return input;
}

function run(input, command = 'audit', flags = ['--quick']) {
  const result = spawnSync(process.execPath, [path.join(skill, 'scripts/vrm-tool.mjs'), command, input, ...flags], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const color = index => ({ pbrMetallicRoughness: { baseColorTexture: { index } } });
const keys = a => a.findings.map(f => f.key);

test('duplicate entries share GPU memory; optional merge has no GPU savings', () => {
  const input = fixture([color(0), color(1)], [{ source: 0 }, { source: 0 }]);
  const before = fs.readFileSync(input);
  const a = run(input);
  assert.equal(a.mes_textures.decodes, 1);
  assert.equal(a.mes_textures.gpu_mb, 4.2);
  assert.equal(a.mes_textures.gpu_mb_if_merged, 4.2);
  assert.equal(a.findings.find(f => f.key === 'duplicate-texture-entries').optional, true);
  const optimized = run(input, 'optimize', ['--merge-textures']);
  assert.equal(optimized.decodes_before, 1);
  assert.equal(optimized.decodes_after, 1);
  assert.equal(optimized.gpu_mb_after, optimized.gpu_mb_before);
  assert.deepEqual(optimized.verify_problems, []);
  assert.deepEqual(fs.readFileSync(input), before);
});

test('sampler indices normalize to effective settings; different wrapping stays separate', () => {
  const textures = [{ source: 0 }, { source: 0, sampler: 0 }, { source: 0, sampler: 1 }];
  const samplers = [{ magFilter: 9729, minFilter: 9729, wrapS: 10497, wrapT: 10497 }, { wrapS: 33071 }];
  const a = run(fixture([color(0), color(1), color(2)], textures, samplers));
  assert.equal(a.mes_textures.decodes, 2);
  assert.equal(a.mes_textures.gpu_mb, 8.4);
});

test('nearest magnification shares across minification choices; color and normal stay separate', () => {
  const textures = [{ source: 0, sampler: 0 }, { source: 0, sampler: 1 }];
  const samplers = [{ magFilter: 9728, minFilter: 9987 }, { minFilter: 9984 }];
  const a = run(fixture([color(0), color(1), { normalTexture: { index: 0 } }], textures, samplers));
  assert.equal(a.mes_textures.decodes, 2);
  assert.equal(a.mes_textures.gpu_mb, 8.4);
});

test('zero coat preserves active sheen, emission and sheen texture usage', () => {
  const a = run(fixture([{ emissiveTexture: { index: 0 }, extensions: {
    KHR_materials_clearcoat: { clearcoatFactor: 0, clearcoatNormalTexture: { index: 0 } },
    KHR_materials_sheen: { sheenColorFactor: [1, 0, 0], sheenColorTexture: { index: 0 } },
  } }]));
  assert.equal(a.mes_textures.decodes, 1);
  assert.equal(keys(a).includes('material-feature'), false);
});

test('volume alone and zero transmission retain emission', () => {
  for (const extensions of [
    { KHR_materials_volume: { thicknessFactor: 1, thicknessTexture: { index: 0 } } },
    { KHR_materials_transmission: { transmissionFactor: 0, transmissionTexture: { index: 0 } } },
  ]) {
    const a = run(fixture([{ emissiveTexture: { index: 0 }, extensions }]));
    assert.equal(a.mes_textures.decodes, 1);
    assert.equal(keys(a).includes('material-feature'), false);
  }
});

test('active transmission omits anisotropy and emission, retaining only its data texture', () => {
  const a = run(fixture([{ emissiveTexture: { index: 0 }, extensions: {
    KHR_materials_transmission: { transmissionFactor: 1, transmissionTexture: { index: 0 } },
    KHR_materials_anisotropy: { anisotropyStrength: 1, anisotropyTexture: { index: 0 } },
  } }]));
  assert.equal(a.mes_textures.decodes, 1);
  const finding = a.findings.find(f => f.key === 'material-feature');
  assert.match(finding.text, /KHR_materials_anisotropy/);
  assert.match(finding.text, /emissive/);
});

test('inactive layers do not produce lost-effect warnings', () => {
  for (const extensions of [
    { KHR_materials_clearcoat: { clearcoatFactor: 1 }, KHR_materials_sheen: { sheenColorFactor: [0, 0, 0] } },
    { KHR_materials_transmission: { transmissionFactor: 1 }, KHR_materials_clearcoat: { clearcoatFactor: 0 }, KHR_materials_sheen: { sheenColorFactor: [0, 0, 0] }, KHR_materials_anisotropy: { anisotropyStrength: 0 } },
    { KHR_materials_unlit: {}, KHR_materials_clearcoat: { clearcoatFactor: 0 }, KHR_materials_sheen: {} },
  ]) {
    const a = run(fixture([{ ...color(0), extensions }]));
    assert.equal(keys(a).includes('material-feature'), false);
  }
});

test('specular-glossiness and unlit retain family priority over transmission', () => {
  for (const extensions of [
    { KHR_materials_unlit: {}, KHR_materials_transmission: { transmissionFactor: 1, transmissionTexture: { index: 0 } } },
    { KHR_materials_pbrSpecularGlossiness: { diffuseTexture: { index: 0 } }, KHR_materials_transmission: { transmissionFactor: 1, transmissionTexture: { index: 0 } } },
  ]) {
    const a = run(fixture([{ ...color(0), emissiveTexture: { index: 0 }, extensions }]));
    assert.equal(a.mes_textures.decodes, 1);
  }
});

test('authored factors are advisory and remain unchanged without explicit clamping', () => {
  const input = fixture([{ extensions: {
    KHR_materials_sheen: { sheenColorFactor: [25, 0, 0] },
    KHR_materials_anisotropy: { anisotropyStrength: 5 },
  } }]);
  const a = run(input);
  const finding = a.findings.find(f => f.key === 'out-of-range');
  assert.equal(finding.group, 'other-apps');
  assert.match(finding.text, /Keeping intentional values is fine/);
  const optimized = run(input, 'optimize', ['--safe']);
  assert.equal(optimized.changes.some(c => c.startsWith('clamp:')), false);
  const clamped = run(input, 'optimize', ['--clamp-materials', '-o', path.join(scratch, 'clamped.vrm')]);
  assert.equal(clamped.changes.filter(c => c.startsWith('clamp:')).length, 2);
});
