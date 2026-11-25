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
  topYCol: Int32Array;
  bottomYCol: Int32Array;
}

/**
 * Computes 2D perimeter contours of the centered pouch inside a studio image:
 * - Row-wise side bounds (leftX[y], rightX[y]) stabilized against floor shadows via middle-torso linear fit.
 * - Column-wise vertical bounds (topYCol[x], bottomYCol[x]) hugging the curved U-shaped stand-up gusset.
 * Works across red (BBQ), green (Sour Cream), gold (Cheese), and white matte (Ordinary) pouches
 * against warm cream backdrops and soft tan floor cast shadows.
 */
export function detectPouchScanlines(
  data: Uint8ClampedArray,
  width: number,
  height: number
): ScanlineBounds {
  const rowBgR = new Float32Array(height);
  const rowBgG = new Float32Array(height);
  const rowBgB = new Float32Array(height);
  const rowBgLum = new Float32Array(height);

  const sampleMargin = Math.max(4, Math.min(18, Math.floor(width * 0.02)));
  for (let y = 0; y < height; y++) {
    const idxL = (y * width + sampleMargin) * 4;
    const idxR = (y * width + (width - 1 - sampleMargin)) * 4;
    const r = (data[idxL] + data[idxR]) * 0.5;
    const g = (data[idxL + 1] + data[idxR + 1]) * 0.5;
    const b = (data[idxL + 2] + data[idxR + 2]) * 0.5;
    rowBgR[y] = r;
    rowBgG[y] = g;
    rowBgB[y] = b;
    rowBgLum[y] = Math.max(20, 0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Distinguishes real pouch foil (red, green, gold, or neutral white matte) from warm cream backdrop AND warm cast shadows
  const isPouchPixel = (x: number, y: number): boolean => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const bgR = rowBgR[y];
    const bgG = rowBgG[y];
    const bgB = rowBgB[y];
    const bgLum = rowBgLum[y];

    const manhattan = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    if (manhattan <= 22) return false;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < bgLum * 0.62) return true;

    const safeLum = Math.max(12, lum);
    const chromaDiff =
      Math.abs(r / safeLum - bgR / bgLum) +
      Math.abs(g / safeLum - bgG / bgLum) +
      Math.abs(b / safeLum - bgB / bgLum);

    return chromaDiff > 0.195;
  };

  // 1. Locate global topY and bottomY across central vertical band
  const centerStart = Math.floor(width * 0.42);
  const centerEnd = Math.floor(width * 0.58);
  let topY = Math.floor(height * 0.14);
  for (let y = Math.floor(height * 0.05); y < Math.floor(height * 0.45); y++) {
    let hits = 0;
    for (let x = centerStart; x <= centerEnd; x += 4) {
      if (isPouchPixel(x, y)) hits++;
    }
    if (hits >= 3) {
      topY = y;
      break;
    }
  }

  let bottomY = Math.floor(height * 0.855);
  for (let y = Math.floor(height * 0.92); y > Math.floor(height * 0.62); y--) {
    let hits = 0;
    for (let x = centerStart; x <= centerEnd; x += 4) {
      if (isPouchPixel(x, y)) hits++;
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

  // 2. Scan left/right side seams per row, and stabilize lower gusset via linear torso regression
  const rawLeft = new Int32Array(height);
  const rawRight = new Int32Array(height);
  const defaultLeft = Math.floor(width * 0.2);
  const defaultRight = Math.floor(width * 0.8);

  for (let y = 0; y < height; y++) {
    if (y < topY || y > bottomY) {
      rawLeft[y] = defaultLeft;
      rawRight[y] = defaultRight;
      continue;
    }

    let lx = defaultLeft;
    for (let x = Math.floor(width * 0.08); x < Math.floor(width * 0.45); x++) {
      const x1 = Math.min(width - 1, x + 2);
      const x2 = Math.min(width - 1, x + 4);
      if (isPouchPixel(x, y) && isPouchPixel(x1, y) && isPouchPixel(x2, y)) {
        lx = x;
        break;
      }
    }

    let rx = defaultRight;
    for (let x = Math.floor(width * 0.92); x > Math.floor(width * 0.55); x--) {
      const x1 = Math.max(0, x - 2);
      const x2 = Math.max(0, x - 4);
      if (isPouchPixel(x, y) && isPouchPixel(x1, y) && isPouchPixel(x2, y)) {
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

  // Linear fit on shadow-free middle torso [22%..72%] prevents floor shadows from flaring side seams outward
  const pouchH = Math.max(1, bottomY - topY);
  const fitStart = Math.round(topY + pouchH * 0.22);
  const fitEnd = Math.round(topY + pouchH * 0.72);
  let sumY = 0;
  let sumYY = 0;
  let sumL = 0;
  let sumYL = 0;
  let sumR = 0;
  let sumYR = 0;
  let count = 0;
  for (let y = fitStart; y <= fitEnd; y++) {
    sumY += y;
    sumYY += y * y;
    sumL += rawLeft[y];
    sumYL += y * rawLeft[y];
    sumR += rawRight[y];
    sumYR += y * rawRight[y];
    count++;
  }
  const denom = count * sumYY - sumY * sumY;
  if (count >= 8 && Math.abs(denom) > 1e-4) {
    const slopeL = (count * sumYL - sumY * sumL) / denom;
    const intL = (sumL - slopeL * sumY) / count;
    const slopeR = (count * sumYR - sumY * sumR) / denom;
    const intR = (sumR - slopeR * sumY) / count;
    const lowerStart = Math.round(topY + pouchH * 0.74);
    for (let y = lowerStart; y <= bottomY; y++) {
      rawLeft[y] = Math.max(rawLeft[y], Math.round(slopeL * y + intL));
      rawRight[y] = Math.min(rawRight[y], Math.round(slopeR * y + intR));
    }
  }

  const leftX = new Int32Array(height);
  const rightX = new Int32Array(height);
  const insetX = Math.max(2, Math.round(width * 0.0055));

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
    leftX[y] = winL[2] + insetX;
    rightX[y] = Math.max(leftX[y] + 16, winR[2] - insetX);
  }

  // 3. Column-wise top & bottom gusset contour tracing so U-shaped corners never leak cream studio floor
  const rawTopCol = new Int32Array(width);
  const rawBotCol = new Int32Array(width);
  const topLimit = Math.min(height - 1, topY + Math.round(pouchH * 0.25));
  const botLimit = Math.max(0, bottomY - Math.round(pouchH * 0.28));
  const topSearchStart = Math.max(0, topY - 10);
  const botSearchStart = Math.min(height - 1, bottomY + 12);

  for (let x = 0; x < width; x++) {
    let ty = topY;
    for (let y = topSearchStart; y <= topLimit; y++) {
      const y1 = Math.min(height - 1, y + 1);
      const y2 = Math.min(height - 1, y + 2);
      if (isPouchPixel(x, y) && isPouchPixel(x, y1) && isPouchPixel(x, y2)) {
        ty = y;
        break;
      }
    }

    let by = bottomY;
    for (let y = botSearchStart; y >= botLimit; y--) {
      const y1 = Math.max(0, y - 1);
      const y2 = Math.max(0, y - 2);
      if (isPouchPixel(x, y) && isPouchPixel(x, y1) && isPouchPixel(x, y2)) {
        by = y;
        break;
      }
    }

    rawTopCol[x] = ty;
    rawBotCol[x] = Math.max(ty + 16, by);
  }

  // 9-tap median smooth along column contours + inward safety inset
  const topYCol = new Int32Array(width);
  const bottomYCol = new Int32Array(width);
  const insetTop = Math.max(2, Math.round(height * 0.003));
  const insetBot = Math.max(3, Math.round(height * 0.011));

  for (let x = 0; x < width; x++) {
    const winT: number[] = [];
    const winB: number[] = [];
    for (let dx = -4; dx <= 4; dx++) {
      const xx = Math.max(0, Math.min(width - 1, x + dx));
      winT.push(rawTopCol[xx]);
      winB.push(rawBotCol[xx]);
    }
    winT.sort((a, b) => a - b);
    winB.sort((a, b) => a - b);
    topYCol[x] = Math.min(bottomY - 12, winT[4] + insetTop);
    bottomYCol[x] = Math.max(topYCol[x] + 12, winB[4] - insetBot);
  }

  return {
    topY: Math.min(bottomY - 10, topY + insetTop),
    bottomY: Math.max(topY + 10, bottomY - insetBot),
    leftX,
    rightX,
    topYCol,
    bottomYCol,
  };
}

/**
 * Bilinear sample + 2D contour unwarp from source studio image data into target RGBA buffer.
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
  const globalSpanY = Math.max(1, bounds.bottomY - bounds.topY);

  for (let dy = 0; dy < dstH; dy++) {
    const v = dy / Math.max(1, dstH - 1);
    const roughY = bounds.topY + v * globalSpanY;
    const ry0 = Math.max(0, Math.min(srcH - 1, Math.floor(roughY)));
    const ry1 = Math.min(srcH - 1, ry0 + 1);
    const rfy = roughY - ry0;

    const lx = bounds.leftX[ry0] * (1 - rfy) + bounds.leftX[ry1] * rfy;
    const rx = bounds.rightX[ry0] * (1 - rfy) + bounds.rightX[ry1] * rfy;
    const spanX = Math.max(1, rx - lx);

    for (let dx = 0; dx < dstW; dx++) {
      const u = dx / Math.max(1, dstW - 1);
      const sxFloat = Math.max(0, Math.min(srcW - 1, lx + u * spanX));
      const sx0 = Math.max(0, Math.min(srcW - 1, Math.floor(sxFloat)));
      const sx1 = Math.min(srcW - 1, sx0 + 1);
      const fx = sxFloat - sx0;

      // Interpolate column-specific U-shaped gusset bounds at sxFloat
      const colTop = bounds.topYCol[sx0] * (1 - fx) + bounds.topYCol[sx1] * fx;
      const colBot = bounds.bottomYCol[sx0] * (1 - fx) + bounds.bottomYCol[sx1] * fx;
      const syFloat = Math.max(0, Math.min(srcH - 1, colTop + v * Math.max(1, colBot - colTop)));

      const sy0 = Math.max(0, Math.min(srcH - 1, Math.floor(syFloat)));
      const sy1 = Math.min(srcH - 1, sy0 + 1);
      const fy = syFloat - sy0;

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
