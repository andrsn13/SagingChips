import * as THREE from 'three';
import type { FlavorId } from '@/lib/order-helpers';

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
    metalness: 0.34,
    roughness: 0.38,
    clearcoat: 0.28,
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
    metalness: 0.36,
    roughness: 0.36,
    clearcoat: 0.3,
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
    metalness: 0.32,
    roughness: 0.38,
    clearcoat: 0.26,
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
    metalness: 0.04,
    roughness: 0.66,
    clearcoat: 0.06,
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

  // Subtle vertical studio foil sheen bands
  const sheenAlpha = palette.isMatteWhite ? 0.06 : 0.11;
  const sheenGrad = ctx.createLinearGradient(0, 0, w, 0);
  sheenGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
  sheenGrad.addColorStop(0.22, `rgba(255,255,255,${sheenAlpha})`);
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
  sheenGrad.addColorStop(0.76, `rgba(255,255,255,${sheenAlpha * 0.75})`);
  sheenGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, w, h);

  // Organic lower wave motif framing the pouch skirt
  ctx.save();
  ctx.globalAlpha = palette.isMatteWhite ? 0.09 : 0.14;
  ctx.fillStyle = palette.isMatteWhite ? '#C85A14' : '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.79);
  ctx.bezierCurveTo(w * 0.3, h * 0.73, w * 0.7, h * 0.88, w, h * 0.78);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Heat-seal edge borders (left & right)
  ctx.fillStyle = palette.isMatteWhite ? 'rgba(120,53,15,0.08)' : 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 0, w * 0.036, h);
  ctx.fillRect(w * 0.964, 0, w * 0.036, h);

  // Top crimp horizontal ribs
  ctx.strokeStyle = palette.isMatteWhite ? 'rgba(92,49,24,0.14)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  for (let y = 10; y < h * 0.072; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

export function createPouchFrontTexture(
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

  // Zipper horizontal highlight band around y ≈ 10.5%
  const zipY = h * 0.105;
  ctx.fillStyle = palette.isMatteWhite ? 'rgba(120,53,15,0.14)' : 'rgba(0,0,0,0.24)';
  ctx.fillRect(0, zipY - 8, w, 16);
  ctx.fillStyle = palette.isMatteWhite ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)';
  ctx.fillRect(0, zipY - 2, w, 4);

  // Clean Saging Studio Sticker Card on Upper Chest (y: 17.5% -> 43%)
  const cardW = w * 0.66;
  const cardH = h * 0.255;
  const cardX = (w - cardW) / 2;
  const cardY = h * 0.175;

  // Soft sticker drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(24,8,2,0.34)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 34);
  ctx.fillStyle = palette.stickerBg;
  ctx.fill();
  ctx.restore();

  // Crisp inner cream border
  ctx.save();
  drawRoundedRect(ctx, cardX + 12, cardY + 12, cardW - 24, cardH - 24, 24);
  ctx.strokeStyle = 'rgba(255,249,240,0.52)';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // Saging Serif Wordmark
  ctx.save();
  ctx.fillStyle = palette.stickerText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 132px Georgia, "Times New Roman", serif';
  ctx.shadowColor = 'rgba(42,16,5,0.32)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillText('Saging', w / 2, cardY + cardH * 0.34);
  ctx.restore();

  // Subhead: BANANA CHIPS
  ctx.save();
  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('B A N A N A   C H I P S', w / 2, cardY + cardH * 0.61);
  ctx.restore();

  // High-contrast Dark Cocoa Flavor Banner Inside Sticker (crisp & never washes out under studio lighting)
  const pillW = cardW * 0.72;
  const pillH = 56;
  const pillX = (w - pillW) / 2;
  const pillY = cardY + cardH * 0.71;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 28);
  ctx.fillStyle = '#3B1A0A';
  ctx.fill();
  ctx.strokeStyle = 'rgba(253,230,138,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFF9F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(palette.title, w / 2, pillY + pillH / 2 + 1);

  // Subtle metallic collar trim above & below the clear window region (y: 44.5% -> 76%)
  ctx.fillStyle = palette.isMatteWhite ? '#C85A14' : '#FDE68A';
  ctx.globalAlpha = palette.isMatteWhite ? 0.88 : 0.75;
  ctx.fillRect(w * 0.04, h * 0.445, w * 0.92, 4);
  ctx.fillRect(w * 0.04, h * 0.76, w * 0.92, 4);
  ctx.globalAlpha = 1;

  // Lower skirt badge: 70g · CRISPY REAL BANANAS
  const footerTextColor = palette.isMatteWhite ? '#3B1A0A' : '#FFF9F0';
  ctx.fillStyle = footerTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('70 g  ·  REAL SABA BANANAS', w / 2, h * 0.855);

  ctx.globalAlpha = 0.82;
  ctx.font = '600 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('ANTIPOLO CITY  ·  PHILIPPINES', w / 2, h * 0.905);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
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

  // Zipper highlight line
  const zipY = h * 0.105;
  ctx.fillStyle = palette.isMatteWhite ? 'rgba(120,53,15,0.14)' : 'rgba(0,0,0,0.24)';
  ctx.fillRect(0, zipY - 8, w, 16);

  // Clean Back-of-Pack Story Card
  const cardW = w * 0.72;
  const cardH = h * 0.44;
  const cardX = (w - cardW) / 2;
  const cardY = h * 0.24;

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

export function createFoilBumpTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  for (let x = 0; x < w; x += 2) {
    const shade = 120 + Math.round(Math.sin(x * 0.7) * 10 + Math.cos(x * 1.9) * 8);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, 0, 1, h);
  }

  for (let y = 0; y < 38; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#D8D8D8' : '#585858';
    ctx.fillRect(0, y, w, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Rich caramelized golden banana chip texture with natural dark roasted center star.
 */
export function createBananaChipTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, size * 0.04, cx, cy, size * 0.5);
  grad.addColorStop(0, '#E8AA2C');
  grad.addColorStop(0.45, '#D48A18');
  grad.addColorStop(0.82, '#A7580A');
  grad.addColorStop(1, '#6E3204');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(92,38,4,0.52)';
  ctx.lineWidth = 4.5;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
    ctx.lineTo(Math.cos(angle) * 36, Math.sin(angle) * 36);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
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
  grad.addColorStop(0, 'rgba(59, 26, 10, 0.34)');
  grad.addColorStop(0.45, 'rgba(59, 26, 10, 0.16)');
  grad.addColorStop(1, 'rgba(59, 26, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
