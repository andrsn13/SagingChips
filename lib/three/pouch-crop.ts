/**
 * Pure pixel-buffer utilities for:
 * 1) Detecting and unwarping studio pouch photography onto edge-to-edge [0..1] UVs
 *    with zero cream backdrop halo.
 * 2) Synthesizing multi-octave foil crinkle heightfields and Sobel tangent-space normals.
 */

export interface ScanlineBounds {
  topY: number;
  bottomY: number;
  leftX: Int32Array;
  rightX: Int32Array;
}

/**
 * Computes per-scanline left/right bounds of the centered pouch inside a studio image.
 * Works across red (BBQ), green (Sour Cream), gold (Cheese), and white matte (Ordinary) pouches
 * against warm cream studio backdrops by measuring Manhattan RGB distance from row margin color.
 */
export function detectPouchScanlines(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ScanlineBounds {
  const rowBgR = new Float32Array(height);
  const rowBgG = new Float32Array(height);
  const rowBgB = new Float32Array(height);

  const sampleMargin = Math.max(4, Math.min(18, Math.floor(width * 0.02)));
  for (let y = 0; y < height; y++) {
    const idxL = (y * width + sampleMargin) * 4;
    const idxR = (y * width + (width - 1 - sampleMargin)) * 4;
    rowBgR[y] = (data[idxL] + data[idxR]) * 0.5;
    rowBgG[y] = (data[idxL + 1] + data[idxR + 1]) * 0.5;
    rowBgB[y] = (data[idxL + 2] + data[idxR + 2]) * 0.5;
  }

  const distAt = (x: number, y: number): number => {
    const idx = (y * width + x) * 4;
    return (
      Math.abs(data[idx] - rowBgR[y]) +
      Math.abs(data[idx + 1] - rowBgG[y]) +
      Math.abs(data[idx + 2] - rowBgB[y])
    );
  };

  // Locate topY and bottomY across a central vertical band (avoiding faint studio floor shadow)
  const centerStart = Math.floor(width * 0.42);
  const centerEnd = Math.floor(width * 0.58);
  let topY = Math.floor(height * 0.14);
  for (let y = Math.floor(height * 0.05); y < Math.floor(height * 0.45); y++) {
    let hits = 0;
    for (let x = centerStart; x <= centerEnd; x += 4) {
      if (distAt(x, y) > 26) hits++;
    }
    if (hits >= 3) {
      topY = y;
      break;
    }
  }

  // Scan upward from below the floor shadow; require stronger chroma/contrast to exclude soft shadow
  let bottomY = Math.floor(height * 0.855);
  for (let y = Math.floor(height * 0.89); y > Math.floor(height * 0.65); y--) {
    let hits = 0;
    for (let x = centerStart; x <= centerEnd; x += 4) {
      if (distAt(x, y) > 42) hits++;
    }
    if (hits >= 3) {
      bottomY = y;
      break;
    }
  }

  if (bottomY <= topY + 20) {
    topY = Math.floor(height * 0.15);
    bottomY = Math.floor(height * 0.86);
  }

  const rawLeft = new Int32Array(height);
  const rawRight = new Int32Array(height);
  const defaultLeft = Math.floor(width * 0.18);
  const defaultRight = Math.floor(width * 0.82);
  const spanYEst = Math.max(1, bottomY - topY);
  const botZoneStart = bottomY - Math.round(spanYEst * 0.15);

  for (let y = 0; y < height; y++) {
    if (y < topY || y > bottomY) {
      rawLeft[y] = defaultLeft;
      rawRight[y] = defaultRight;
      continue;
    }

    const tBot =
      y > botZoneStart
        ? Math.min(1, (y - botZoneStart) / Math.max(1, bottomY - botZoneStart))
        : 0;
    const thresh = Math.round(26 + tBot * 20);

    let lx = defaultLeft;
    for (let x = Math.floor(width * 0.08); x < Math.floor(width * 0.45); x++) {
      if (distAt(x, y) > thresh && distAt(Math.min(width - 1, x + 4), y) > thresh) {
        lx = x;
        break;
      }
    }

    let rx = defaultRight;
    for (let x = Math.floor(width * 0.92); x > Math.floor(width * 0.55); x--) {
      if (distAt(x, y) > thresh && distAt(Math.max(0, x - 4), y) > thresh) {
        rx = x;
        break;
      }
    }

    if (rx - lx < width * 0.42) {
      lx = defaultLeft;
      rx = defaultRight;
    }

    rawLeft[y] = lx;
    rawRight[y] = rx;
  }

  // 5-tap median smoothing + tapered inward inset (slightly deeper around bottom rounded corners)
  const leftX = new Int32Array(height);
  const rightX = new Int32Array(height);
  const baseInsetPx = Math.max(2, Math.round(width * 0.0055));
  const cornerExtraInsetPx = Math.max(2, Math.round(width * 0.011));

  for (let y = 0; y < height; y++) {
    const winL: number[] = [];
    const winR: number[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      const yy = Math.max(topY, Math.min(bottomY, y + dy));
      winL.push(rawLeft[yy]);
      winR.push(rawRight[yy]);
    }
    winL.sort((a, b) => a - b);
    winR.sort((a, b) => a - b);

    const tBot =
      y > botZoneStart
        ? Math.min(1, (y - botZoneStart) / Math.max(1, bottomY - botZoneStart))
        : 0;
    const rowInset = baseInsetPx + Math.round(tBot * cornerExtraInsetPx);

    leftX[y] = winL[2] + rowInset;
    rightX[y] = Math.max(leftX[y] + 16, winR[2] - rowInset);
  }

  return {
    topY: Math.min(bottomY - 10, topY + 2),
    bottomY: Math.max(topY + 10, bottomY - 3),
    leftX,
    rightX,
  };
}

/**
 * Bilinear sample + scanline unwarp from source studio image data into target RGBA buffer.
 */
export function unwarpStudioPouchPixels(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstData: Uint8ClampedArray,
  dstW: number,
  dstH: number
): void {
  const bounds = detectPouchScanlines(srcData, srcW, srcH);
  const spanY = Math.max(1, bounds.bottomY - bounds.topY);

  for (let dy = 0; dy < dstH; dy++) {
    const v = dy / Math.max(1, dstH - 1);
    const syFloat = bounds.topY + v * spanY;
    const sy0 = Math.max(0, Math.min(srcH - 1, Math.floor(syFloat)));
    const sy1 = Math.min(srcH - 1, sy0 + 1);
    const fy = syFloat - sy0;

    const lx = bounds.leftX[sy0] * (1 - fy) + bounds.leftX[sy1] * fy;
    const rx = bounds.rightX[sy0] * (1 - fy) + bounds.rightX[sy1] * fy;
    const spanX = Math.max(1, rx - lx);

    // Subtle edge seam shading on outer 2.5% to integrate cleanly into 3D side rim
    for (let dx = 0; dx < dstW; dx++) {
      const u = dx / Math.max(1, dstW - 1);
      const sxFloat = lx + u * spanX;
      const sx0 = Math.max(0, Math.min(srcW - 1, Math.floor(sxFloat)));
      const sx1 = Math.min(srcW - 1, sx0 + 1);
      const fx = sxFloat - sx0;

      const i00 = (sy0 * srcW + sx0) * 4;
      const i10 = (sy0 * srcW + sx1) * 4;
      const i01 = (sy1 * srcW + sx0) * 4;
      const i11 = (sy1 * srcW + sx1) * 4;

      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;

      const r = srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11;
      const g =
        srcData[i00 + 1] * w00 +
        srcData[i10 + 1] * w10 +
        srcData[i01 + 1] * w01 +
        srcData[i11 + 1] * w11;
      const b =
        srcData[i00 + 2] * w00 +
        srcData[i10 + 2] * w10 +
        srcData[i01 + 2] * w01 +
        srcData[i11 + 2] * w11;

      const outIdx = (dy * dstW + dx) * 4;
      dstData[outIdx] = Math.round(r);
      dstData[outIdx + 1] = Math.round(g);
      dstData[outIdx + 2] = Math.round(b);
      dstData[outIdx + 3] = 255;
    }
  }
}

/**
 * Deterministic 2D smooth value noise for multi-octave foil crinkle heightfields.
 */
export function sampleValueNoise2D(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const hash = (ix: number, iy: number): number => {
    const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };

  const n00 = hash(xi, yi);
  const n10 = hash(xi + 1, yi);
  const n01 = hash(xi, yi + 1);
  const n11 = hash(xi + 1, yi + 1);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

/**
 * Converts a scalar heightfield into an RGB tangent-space normal pixel using Sobel gradients.
 */
export function computeSobelNormal(
  heightField: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  strength: number
): [number, number, number] {
  const sample = (sx: number, sy: number) => {
    const cx = Math.max(0, Math.min(width - 1, sx));
    const cy = Math.max(0, Math.min(height - 1, sy));
    return heightField[cy * width + cx];
  };

  const tl = sample(x - 1, y - 1);
  const t = sample(x, y - 1);
  const tr = sample(x + 1, y - 1);
  const l = sample(x - 1, y);
  const r = sample(x + 1, y);
  const bl = sample(x - 1, y + 1);
  const b = sample(x, y + 1);
  const br = sample(x + 1, y + 1);

  const dX = tr + 2 * r + br - (tl + 2 * l + bl);
  const dY = bl + 2 * b + br - (tl + 2 * t + tr);

  let nx = -dX * strength;
  let ny = dY * strength;
  let nz = 1.0;

  const invLen = 1 / Math.hypot(nx, ny, nz);
  nx *= invLen;
  ny *= invLen;
  nz *= invLen;

  return [
    Math.round((nx * 0.5 + 0.5) * 255),
    Math.round((ny * 0.5 + 0.5) * 255),
    Math.round((nz * 0.5 + 0.5) * 255),
  ];
}
