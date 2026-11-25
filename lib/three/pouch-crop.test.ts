import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeSobelNormal,
  detectPouchScanlines,
  sampleValueNoise2D,
  unwarpStudioPouchPixels,
} from './pouch-crop.ts';

test('detectPouchScanlines strips uniform cream backdrop margins cleanly even for white matte pouch', () => {
  const w = 120;
  const h = 160;
  const data = new Uint8ClampedArray(w * h * 4);

  // Fill studio warm cream background RGB(243, 223, 196)
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 243;
    data[i * 4 + 1] = 223;
    data[i * 4 + 2] = 196;
    data[i * 4 + 3] = 255;
  }

  // Paint centered neutral white matte pouch RGB(242, 240, 238) inside x in [24..95], y in [26..135]
  for (let y = 26; y <= 135; y++) {
    for (let x = 24; x <= 95; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = 242;
      data[idx + 1] = 240;
      data[idx + 2] = 238;
    }
  }

  const bounds = detectPouchScanlines(data, w, h);
  assert.ok(bounds.topY >= 26 && bounds.topY <= 30);
  assert.ok(bounds.bottomY >= 131 && bounds.bottomY <= 135);
  assert.ok(bounds.leftX[80] >= 24 && bounds.leftX[80] <= 28);
  assert.ok(bounds.rightX[80] >= 91 && bounds.rightX[80] <= 95);

  // Verify unwarp maps pouch edges cleanly without leaking cream backdrop
  const dst = new Uint8ClampedArray(60 * 80 * 4);
  unwarpStudioPouchPixels(data, w, h, dst, 60, 80);
  // Top-left corner pixel of unwrapped texture should be neutral white pouch, not warm cream
  assert.ok(Math.abs(dst[0] - dst[2]) <= 8, `Expected neutral white pouch pixel, got R=${dst[0]}, B=${dst[2]}`);
});

test('unwarpStudioPouchPixels traces U-shaped curved bottom gusset corners without leaking cream or floor shadow', () => {
  const w = 140;
  const h = 180;
  const data = new Uint8ClampedArray(w * h * 4);

  // Cream background
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 246;
    data[i * 4 + 1] = 228;
    data[i * 4 + 2] = 197;
    data[i * 4 + 3] = 255;
  }

  // Soft warm tan floor shadow below pouch
  for (let y = 135; y <= 156; y++) {
    for (let x = 22; x <= 118; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = 216;
      data[idx + 1] = 188;
      data[idx + 2] = 152;
    }
  }

  // Paint emerald green pouch with curved U-shaped bottom gusset (center drops to y=150, corners curve up to y=132)
  for (let x = 26; x <= 114; x++) {
    const u = ((x - 70) / 44);
    const botY = Math.round(150 - 18 * u * u);
    for (let y = 28; y <= botY; y++) {
      const idx = (y * w + x) * 4;
      data[idx] = 22;
      data[idx + 1] = 138;
      data[idx + 2] = 56;
    }
  }

  const dstW = 80;
  const dstH = 100;
  const dst = new Uint8ClampedArray(dstW * dstH * 4);
  unwarpStudioPouchPixels(data, w, h, dst, dstW, dstH);

  // Check bottom-left, bottom-center, and bottom-right corner pixels: ALL must be emerald green (G > R + 40), zero cream/shadow!
  for (const dx of [0, 3, 40, dstW - 4, dstW - 1]) {
    const idx = ((dstH - 1) * dstW + dx) * 4;
    assert.ok(
      dst[idx + 1] > dst[idx] + 40,
      `Expected green foil at bottom dx=${dx}, got RGB(${dst[idx]}, ${dst[idx + 1]}, ${dst[idx + 2]})`
    );
  }
});

test('computeSobelNormal returns unit-normal RGB centered at (128,128,255) on flat heightfield', () => {
  const field = new Float32Array(16).fill(0.5);
  const [r, g, b] = computeSobelNormal(field, 4, 4, 2, 2, 2.0);
  assert.equal(r, 128);
  assert.equal(g, 128);
  assert.equal(b, 255);
});

test('sampleValueNoise2D produces smooth bounded [0,1] output', () => {
  for (let x = 0; x < 10; x += 0.37) {
    const val = sampleValueNoise2D(x, x * 1.41);
    assert.ok(val >= 0 && val <= 1);
  }
});
