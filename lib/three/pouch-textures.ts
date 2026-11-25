import * as THREE from 'three';
import type { FlavorId } from '@/lib/order-helpers';
import {
  computeSobelNormal,
  sampleValueNoise2D,
  unwarpStudioPouchPixels,
} from './pouch-crop';

export interface FlavorPouchPalette {
  id: FlavorId;
  title: string;
  baseTop: string;
  baseMid: string;
  baseBottom: string;
  gussetHex: number;
  stickerBg: string;
  stickerText: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  isMatteWhite?: boolean;
}

export const POUCH_PALETTES: Record<FlavorId, FlavorPouchPalette> = {
  bbq: {
    id: 'bbq',
    title: 'BBQ',
    baseTop: '#8E1313',
    baseMid: '#B91C1C',
    baseBottom: '#650C0C',
    gussetHex: 0x700e0e,
    stickerBg: '#C85A14',
    stickerText: '#FFFDF8',
    metalness: 0.28,
    roughness: 0.42,
    clearcoat: 0.32,
  },
  'sour-cream': {
    id: 'sour-cream',
    title: 'SOUR CREAM',
    baseTop: '#0F592B',
    baseMid: '#157A3B',
    baseBottom: '#083B1B',
    gussetHex: 0x0a421f,
    stickerBg: '#C85A14',
    stickerText: '#FFFDF8',
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.34,
  },
  cheese: {
    id: 'cheese',
    title: 'CHEESE',
    baseTop: '#B86A0B',
    baseMid: '#D98816',
    baseBottom: '#7E4205',
    gussetHex: 0x874806,
    stickerBg: '#C85A14',
    stickerText: '#FFFDF8',
    metalness: 0.28,
    roughness: 0.42,
    clearcoat: 0.3,
  },
  ordinary: {
    id: 'ordinary',
    title: 'ORDINARY',
    baseTop: '#F5EFE5',
    baseMid: '#ECE3D4',
    baseBottom: '#D6C9B6',
    gussetHex: 0xd9cdbc,
    stickerBg: '#C85A14',
    stickerText: '#FFFDF8',
    metalness: 0.05,
    roughness: 0.64,
    clearcoat: 0.08,
    isMatteWhite: true,
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function paintBaseFoil(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: FlavorPouchPalette
) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grad.addColorStop(0, palette.baseTop);
  grad.addColorStop(0.45, palette.baseMid);
  grad.addColorStop(1, palette.baseBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const sheenAlpha = palette.isMatteWhite ? 0.05 : 0.1;
  const sheenGrad = ctx.createLinearGradient(0, 0, w, 0);
  sheenGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
  sheenGrad.addColorStop(0.22, `rgba(255,255,255,${sheenAlpha})`);
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
  sheenGrad.addColorStop(0.76, `rgba(255,255,255,${sheenAlpha * 0.75})`);
  sheenGrad.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = palette.isMatteWhite ? 0.08 : 0.13;
  ctx.fillStyle = palette.isMatteWhite ? '#C85A14' : '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.79);
  ctx.bezierCurveTo(w * 0.3, h * 0.73, w * 0.7, h * 0.88, w, h * 0.78);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = palette.isMatteWhite ? 'rgba(120,53,15,0.08)' : 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 0, w * 0.036, h);
  ctx.fillRect(w * 0.964, 0, w * 0.036, h);

  ctx.strokeStyle = palette.isMatteWhite ? 'rgba(92,49,24,0.14)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  for (let y = 10; y < h * 0.072; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/**
 * Synchronous procedural fallback front texture shown immediately while studio JPG decodes (~15ms).
 */
export function createPouchFrontTexture(
  flavorId: FlavorId,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const palette = POUCH_PALETTES[flavorId];
  const w = 512;
  const h = 682;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  paintBaseFoil(ctx, w, h, palette);

  const cardW = w * 0.66;
  const cardH = h * 0.255;
  const cardX = (w - cardW) / 2;
  const cardY = h * 0.2;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.fillStyle = palette.stickerBg;
  ctx.fill();

  ctx.fillStyle = palette.stickerText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 66px Georgia, "Times New Roman", serif';
  ctx.fillText('Saging', w / 2, cardY + cardH * 0.38);

  const pillW = cardW * 0.72;
  const pillH = 30;
  drawRoundedRect(ctx, (w - pillW) / 2, cardY + cardH * 0.68, pillW, pillH, 15);
  ctx.fillStyle = '#3B1A0A';
  ctx.fill();

  ctx.fillStyle = '#FFF9F0';
  ctx.font = '800 16px system-ui, sans-serif';
  ctx.fillText(palette.title, w / 2, cardY + cardH * 0.68 + pillH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Loads the studio-engineered pouch image, trims cream backdrop per scanline,
 * unwarps edge-to-edge onto a 1024x1365 albedo texture, and returns a crisp CanvasTexture.
 */
export function createStudioPhotoFrontTexture(
  imageSrc: string,
  maxAnisotropy: number
): Promise<THREE.CanvasTexture | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = srcW;
        srcCanvas.height = srcH;
        const srcCtx = srcCanvas.getContext('2d');
        if (!srcCtx) {
          resolve(null);
          return;
        }
        srcCtx.drawImage(img, 0, 0, srcW, srcH);
        const srcImageData = srcCtx.getImageData(0, 0, srcW, srcH);

        const dstW = 1024;
        const dstH = 1365;
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = dstW;
        dstCanvas.height = dstH;
        const dstCtx = dstCanvas.getContext('2d');
        if (!dstCtx) {
          resolve(null);
          return;
        }
        const dstImageData = dstCtx.createImageData(dstW, dstH);

        unwarpStudioPouchPixels(
          srcImageData.data,
          srcW,
          srcH,
          dstImageData.data,
          dstW,
          dstH
        );
        dstCtx.putImageData(dstImageData, 0, 0);

        // Subtle outer edge seam blend so perimeter edges marry seamlessly into the 3D side rim
        const seamGrad = dstCtx.createLinearGradient(0, 0, dstW, 0);
        seamGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
        seamGrad.addColorStop(0.028, 'rgba(0,0,0,0)');
        seamGrad.addColorStop(0.972, 'rgba(0,0,0,0)');
        seamGrad.addColorStop(1, 'rgba(0,0,0,0.14)');
        dstCtx.fillStyle = seamGrad;
        dstCtx.fillRect(0, 0, dstW, dstH);

        const texture = new THREE.CanvasTexture(dstCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, maxAnisotropy);
        texture.needsUpdate = true;
        resolve(texture);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

export function createPouchBackTexture(
  flavorId: FlavorId,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const palette = POUCH_PALETTES[flavorId];
  const w = 1024;
  const h = 1365;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  paintBaseFoil(ctx, w, h, palette);

  const zipY = h * 0.115;
  ctx.fillStyle = palette.isMatteWhite ? 'rgba(120,53,15,0.14)' : 'rgba(0,0,0,0.24)';
  ctx.fillRect(0, zipY - 8, w, 16);

  const cardW = w * 0.72;
  const cardH = h * 0.44;
  const cardX = (w - cardW) / 2;
  const cardY = h * 0.25;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fillStyle = palette.isMatteWhite
    ? 'rgba(255,253,248,0.96)'
    : 'rgba(255,249,240,0.95)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(200,90,20,0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C85A14';
  ctx.font = '900 72px Georgia, "Times New Roman", serif';
  ctx.fillText('Saging', w / 2, cardY + 86);

  ctx.fillStyle = '#7A350C';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('SMALL PACK. BIG HAPPINESS.', w / 2, cardY + 138);

  ctx.fillStyle = 'rgba(59,26,10,0.14)';
  ctx.fillRect(cardX + 64, cardY + 174, cardW - 128, 2);

  ctx.fillStyle = '#3B1A0A';
  ctx.font = '800 32px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${palette.title} FLAVOR`, w / 2, cardY + 230);

  ctx.fillStyle = '#5C3118';
  ctx.font = '500 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('Thin-sliced real saba bananas cooked', w / 2, cardY + 292);
  ctx.fillText('golden and sealed fresh in every pouch.', w / 2, cardY + 328);

  ctx.fillStyle = '#7A350C';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('NET WT. 70 g  ·  RESEALABLE ZIP POUCH', w / 2, cardY + 412);
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('Store in a cool, dry place.', w / 2, cardY + 452);

  ctx.fillStyle = '#C85A14';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('@sagingchips.ph  ·  Antipolo City', w / 2, cardY + 528);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates shared high-frequency foil crinkle tangent-space normal map
 * AND spatially varying PBR roughness map (glossy viewing window, satin foil, matte crimp edges).
 */
export function createFoilCrinkleMaps(maxAnisotropy: number): {
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 682;
  const heightField = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1); // 0 = top seal, 1 = bottom gusset in canvas space
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1); // 0 = left, 1 = right
      const uCentered = (u - 0.5) * 2; // [-1, 1]

      // Keep center sticker & viewing window flatter while accentuating shoulder, seam, & gusset crinkles
      const inStickerCenter =
        v >= 0.19 && v <= 0.52 && Math.abs(uCentered) < 0.72
          ? Math.max(0, 1 - Math.abs(uCentered) / 0.72) *
            Math.sin(((v - 0.19) / 0.33) * Math.PI)
          : 0;
      const edgeWeight =
        Math.min(
          1,
          0.18 + 0.82 * (Math.pow(Math.abs(uCentered), 1.55) + (v < 0.2 || v > 0.78 ? 0.55 : 0))
        ) *
        (1 - 0.76 * inStickerCenter);

      // Multi-octave organic foil crinkle folds
      const n1 = sampleValueNoise2D(u * 4.8, v * 6.9);
      const n2 = sampleValueNoise2D(u * 10.5 + 13.7, v * 14.2 + 4.1);
      const n3 = sampleValueNoise2D(u * 23.0 + 31.2, v * 28.0 + 19.3);

      // Diagonal corner tension creases radiating from top zipper shoulders
      const diagL = Math.sin((u * 13 + v * 8.5) * Math.PI) * Math.max(0, 1 - Math.hypot(u, v - 0.16) * 2.3);
      const diagR = Math.sin(((1 - u) * 13 + v * 8.5) * Math.PI) * Math.max(0, 1 - Math.hypot(1 - u, v - 0.16) * 2.3);

      // Lower gusset vertical pleats
      const bottomPleat =
        v > 0.78
          ? Math.sin(uCentered * 11) * ((v - 0.78) / 0.22) * 0.16
          : 0;

      // Top heat-seal horizontal crimp grooves (v < 0.068)
      const topCrimp = v < 0.068 ? Math.sin(v * 340) * 0.26 : 0;

      // Embossed twin zipper lock ridges around v ≈ 0.115
      const zipDist = Math.abs(v - 0.115);
      const zipRidge = zipDist < 0.015 ? Math.cos((zipDist / 0.015) * Math.PI * 1.5) * 0.42 : 0;

      heightField[y * w + x] =
        (n1 * 0.48 + n2 * 0.26 + n3 * 0.1 + diagL * 0.2 + diagR * 0.2) * edgeWeight +
        bottomPleat +
        topCrimp +
        zipRidge;
    }
  }

  // Convert heightfield to tangent-space Normal Map
  const normCanvas = document.createElement('canvas');
  normCanvas.width = w;
  normCanvas.height = h;
  const normCtx = normCanvas.getContext('2d')!;
  const normImg = normCtx.createImageData(w, h);

  // Build matching PBR Roughness Map
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const idx = (y * w + x) * 4;

      const [nr, ng, nb] = computeSobelNormal(heightField, w, h, x, y, 1.35);
      normImg.data[idx] = nr;
      normImg.data[idx + 1] = ng;
      normImg.data[idx + 2] = nb;
      normImg.data[idx + 3] = 255;

      // Roughness modulation: glossy clear window, matte-satin label, satin metallic foil, textured crimp edges
      const inWindow = v >= 0.54 && v <= 0.77 && u >= 0.14 && u <= 0.86;
      const inSticker = v >= 0.21 && v <= 0.51 && u >= 0.16 && u <= 0.84;
      const inMargin = u < 0.05 || u > 0.95 || v < 0.075;
      const microVar = (heightField[y * w + x] - 0.35) * 18;
      const baseRough = inWindow ? 50 : inSticker ? 148 : inMargin ? 156 : 104;
      const roughByte = Math.max(28, Math.min(235, Math.round(baseRough + microVar)));

      roughImg.data[idx] = roughByte;
      roughImg.data[idx + 1] = roughByte;
      roughImg.data[idx + 2] = roughByte;
      roughImg.data[idx + 3] = 255;
    }
  }

  normCtx.putImageData(normImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.anisotropy = Math.min(8, maxAnisotropy);
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = Math.min(4, maxAnisotropy);
  roughnessMap.needsUpdate = true;

  return { normalMap, roughnessMap };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, size * 0.04, cx, cy, size * 0.48);
  grad.addColorStop(0, 'rgba(59, 26, 10, 0.36)');
  grad.addColorStop(0.45, 'rgba(59, 26, 10, 0.16)');
  grad.addColorStop(1, 'rgba(59, 26, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
