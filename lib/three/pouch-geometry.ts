import * as THREE from 'three';
import type { FlavorId } from '@/lib/order-helpers';
import {
  POUCH_PALETTES,
  createPouchBackTexture,
  createPouchFrontTexture,
} from './pouch-textures';

export const POUCH_WIDTH = 1.62;
export const POUCH_HEIGHT = 2.24;

// Vertical normalized v in [0, 1] boundaries for the viewing window
const WIN_V_BOTTOM = 0.24; // ~ y = -0.58
const WIN_V_TOP = 0.555; // ~ y = +0.12
const WIN_U_LIMIT = 0.86; // side foil borders keep realistic edge seams

/**
 * Continuous mathematical stand-up pouch profile:
 * Returns world (x, y, z) on the front (+Z) or back (-Z) surface for normalized
 * u in [-1, 1] (left to right) and v in [0, 1] (bottom gusset to top heat seal).
 */
function evalPouchSurface(u: number, v: number, side: 1 | -1): [number, number, number] {
  const halfW = POUCH_WIDTH * 0.5;

  const widthFactor = 0.94 + 0.06 * Math.sin(v * Math.PI * 0.85);
  // Subtle rounded bottom AND top die-cut corners
  const cornerRoundBot = v < 0.06 ? 1 - 0.045 * (1 - v / 0.06) : 1;
  const cornerRoundTop = v > 0.96 ? 1 - 0.025 * ((v - 0.96) / 0.04) : 1;
  const x = u * halfW * widthFactor * cornerRoundBot * cornerRoundTop;

  // Tear notches indented near v ≈ 0.935 on outer edges
  const notchDist = Math.abs(v - 0.935);
  const edgeWeight = Math.max(0, (Math.abs(u) - 0.92) / 0.08);
  const notchIndent = notchDist < 0.02 ? (1 - notchDist / 0.02) * 0.045 * edgeWeight : 0;
  const finalX = x - Math.sign(u) * notchIndent;

  const y = (v - 0.5) * POUCH_HEIGHT;

  // Side heat-seal seam pinch
  const seamTaper = Math.pow(Math.max(0, Math.cos((u * Math.PI) / 2)), 0.58);

  // Vertical puff envelope: pinched flat above zipper (v > 0.89), puffed at belly & base gusset
  let vEnvelope = 0;
  if (v < 0.89) {
    const vn = v / 0.89;
    const belly = Math.sin(vn * Math.PI * 0.92);
    const gussetBase = Math.pow(1 - vn, 0.72) * 0.52;
    vEnvelope = Math.min(1, belly * 0.78 + gussetBase * 0.62);
  }

  // Slight inward pinch along zipper line v ≈ 0.89
  const zipperPinch = 1 - 0.35 * Math.exp(-Math.pow((v - 0.89) / 0.02, 2));

  const zMag = 0.016 + 0.255 * seamTaper * vEnvelope * zipperPinch;
  return [finalX, y, side * zMag];
}

function createPouchPatchGeometry(
  side: 1 | -1,
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number,
  uSegs: number,
  vSegs: number,
  zOffset = 0
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const cols = uSegs + 1;
  for (let iy = 0; iy <= vSegs; iy++) {
    const tv = iy / vSegs;
    const v = vMin + (vMax - vMin) * tv;
    for (let ix = 0; ix <= uSegs; ix++) {
      const tu = ix / uSegs;
      const u = uMin + (uMax - uMin) * tu;
      const [px, py, pz] = evalPouchSurface(u, v, side);
      positions.push(px, py, pz + side * zOffset);

      const uvU = side === 1 ? (u + 1) * 0.5 : 1 - (u + 1) * 0.5;
      uvs.push(uvU, v);
    }
  }

  for (let iy = 0; iy < vSegs; iy++) {
    for (let ix = 0; ix < uSegs; ix++) {
      const a = iy * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (side === 1) {
        indices.push(a, b, d, a, d, c);
      } else {
        indices.push(a, d, b, a, c, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createSharedChipGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.125, 0.125, 0.022, 18, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ripple = Math.sin(x * 15 + z * 10) * 0.008;
    pos.setXYZ(i, x * 1.12, y + ripple, z * 0.9);
  }
  geo.computeVertexNormals();
  return geo;
}

export interface PouchInstanceResources {
  root: THREE.Group;
  hitMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

export interface SharedPouchAssets {
  chipGeometry: THREE.BufferGeometry;
  chipMaterial: THREE.MeshStandardMaterial;
  foilBumpTexture: THREE.Texture;
  shadowTexture: THREE.Texture;
}

export function buildFlavorPouch(
  flavorId: FlavorId,
  flavorIndex: number,
  shared: SharedPouchAssets,
  isSoftwareGl: boolean,
  maxAnisotropy: number
): PouchInstanceResources {
  const palette = POUCH_PALETTES[flavorId];
  const root = new THREE.Group();
  root.name = `pouch-${flavorId}`;

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const frontTex = createPouchFrontTexture(flavorId, maxAnisotropy);
  const backTex = createPouchBackTexture(flavorId, maxAnisotropy);
  textures.push(frontTex, backTex);

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: frontTex,
    bumpMap: shared.foilBumpTexture,
    bumpScale: palette.isMatteWhite ? 0.004 : 0.007,
    metalness: palette.metalness,
    roughness: palette.roughness,
    clearcoat: isSoftwareGl ? 0 : palette.clearcoat,
    clearcoatRoughness: 0.25,
  });

  const backMat = new THREE.MeshPhysicalMaterial({
    map: backTex,
    bumpMap: shared.foilBumpTexture,
    bumpScale: palette.isMatteWhite ? 0.004 : 0.007,
    metalness: palette.metalness,
    roughness: palette.roughness,
    clearcoat: isSoftwareGl ? 0 : palette.clearcoat,
    clearcoatRoughness: 0.25,
  });

  const interiorLinerMat = new THREE.MeshStandardMaterial({
    color: palette.isMatteWhite ? 0x5c3118 : 0x381707,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.FrontSide,
  });

  const gussetMat = new THREE.MeshStandardMaterial({
    color: palette.gussetHex,
    roughness: palette.roughness + 0.1,
    metalness: palette.metalness * 0.75,
  });

  const windowMat = isSoftwareGl
    ? new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.16,
        roughness: 0.14,
        metalness: 0.12,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0xfffdf8,
        transparent: true,
        opacity: 0.18,
        roughness: 0.07,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
        depthWrite: false,
      });

  materials.push(frontMat, backMat, interiorLinerMat, gussetMat, windowMat);

  const frontTopGeo = createPouchPatchGeometry(1, -1, 1, WIN_V_TOP, 1, 24, 16);
  const frontBotGeo = createPouchPatchGeometry(1, -1, 1, 0, WIN_V_BOTTOM, 24, 10);
  const frontLeftBorderGeo = createPouchPatchGeometry(
    1,
    -1,
    -WIN_U_LIMIT,
    WIN_V_BOTTOM,
    WIN_V_TOP,
    4,
    10
  );
  const frontRightBorderGeo = createPouchPatchGeometry(
    1,
    WIN_U_LIMIT,
    1,
    WIN_V_BOTTOM,
    WIN_V_TOP,
    4,
    10
  );
  const backFullGeo = createPouchPatchGeometry(-1, -1, 1, 0, 1, 24, 24);
  const innerBayGeo = createPouchPatchGeometry(
    1,
    -WIN_U_LIMIT * 0.96,
    WIN_U_LIMIT * 0.96,
    WIN_V_BOTTOM + 0.01,
    WIN_V_TOP - 0.01,
    12,
    10,
    -0.23
  );
  const windowGeo = createPouchPatchGeometry(
    1,
    -WIN_U_LIMIT,
    WIN_U_LIMIT,
    WIN_V_BOTTOM,
    WIN_V_TOP,
    18,
    10,
    0.002
  );

  const zipRidgeGeo = new THREE.CapsuleGeometry(0.015, POUCH_WIDTH * 0.9, 4, 10);
  zipRidgeGeo.rotateZ(Math.PI / 2);

  // Gusset tucked cleanly inside the lower skirt (matching foil color, zero dark overhang)
  const gussetCapGeo = new THREE.CylinderGeometry(0.14, 0.16, POUCH_WIDTH * 0.8, 14);
  gussetCapGeo.rotateZ(Math.PI / 2);
  gussetCapGeo.scale(1, 0.24, 1);

  geometries.push(
    frontTopGeo,
    frontBotGeo,
    frontLeftBorderGeo,
    frontRightBorderGeo,
    backFullGeo,
    innerBayGeo,
    windowGeo,
    zipRidgeGeo,
    gussetCapGeo
  );

  const frontTopMesh = new THREE.Mesh(frontTopGeo, frontMat);
  const frontBotMesh = new THREE.Mesh(frontBotGeo, frontMat);
  const frontLeftMesh = new THREE.Mesh(frontLeftBorderGeo, frontMat);
  const frontRightMesh = new THREE.Mesh(frontRightBorderGeo, frontMat);
  const backMesh = new THREE.Mesh(backFullGeo, backMat);
  const innerBayMesh = new THREE.Mesh(innerBayGeo, interiorLinerMat);

  const windowMesh = new THREE.Mesh(windowGeo, windowMat);
  windowMesh.renderOrder = 3;

  const zipFront = new THREE.Mesh(zipRidgeGeo, frontMat);
  zipFront.position.set(0, (0.89 - 0.5) * POUCH_HEIGHT, 0.024);
  const zipBack = new THREE.Mesh(zipRidgeGeo, backMat);
  zipBack.position.set(0, (0.89 - 0.5) * POUCH_HEIGHT, -0.024);

  const gussetMesh = new THREE.Mesh(gussetCapGeo, gussetMat);
  gussetMesh.position.set(0, -POUCH_HEIGHT * 0.475, 0);

  // Dense organic tumbled heap of 42 golden banana chips using orthogonal Halton sequences
  const chipCount = 42;
  const chipsInstanced = new THREE.InstancedMesh(
    shared.chipGeometry,
    shared.chipMaterial,
    chipCount
  );
  chipsInstanced.renderOrder = 1;

  const halton = (index: number, base: number): number => {
    let f = 1;
    let r = 0;
    let n = index;
    while (n > 0) {
      f /= base;
      r += f * (n % base);
      n = Math.floor(n / base);
    }
    return r;
  };

  const dummy = new THREE.Object3D();
  const chipColor = new THREE.Color();

  for (let i = 0; i < chipCount; i++) {
    const seedIdx = i + 1 + flavorIndex * 11;
    const h1 = halton(seedIdx, 2);
    const h2 = halton(seedIdx, 3);
    const h3 = halton(seedIdx, 5);

    const cx = (h1 - 0.5) * 1.14;
    const cy = -0.52 + h2 * 0.58;
    const cz = -0.02 + h3 * 0.16;

    dummy.position.set(cx, cy, cz);
    dummy.rotation.set(
      1.18 + (h3 - 0.5) * 1.1,
      (h1 - 0.5) * 1.9,
      (h2 - 0.5) * 2.6
    );
    const chipScale = 0.9 + h3 * 0.42;
    dummy.scale.set(chipScale, chipScale, chipScale);
    dummy.updateMatrix();
    chipsInstanced.setMatrixAt(i, dummy.matrix);

    const depthShade = 0.72 + 0.28 * h3;
    chipColor.setRGB(depthShade, depthShade * 0.95, depthShade * 0.88);
    chipsInstanced.setColorAt(i, chipColor);
  }
  chipsInstanced.instanceMatrix.needsUpdate = true;
  if (chipsInstanced.instanceColor) {
    chipsInstanced.instanceColor.needsUpdate = true;
  }

  const shadowGeo = new THREE.PlaneGeometry(POUCH_WIDTH * 1.38, 1.15);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shared.shadowTexture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  geometries.push(shadowGeo);
  materials.push(shadowMat);

  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -POUCH_HEIGHT * 0.5 - 0.06, 0);
  shadowMesh.renderOrder = -1;

  const hitGeo = new THREE.BoxGeometry(POUCH_WIDTH * 0.96, POUCH_HEIGHT * 0.98, 0.58);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  geometries.push(hitGeo);
  materials.push(hitMat);

  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.userData = { flavorIndex, flavorId };

  root.add(
    frontTopMesh,
    frontBotMesh,
    frontLeftMesh,
    frontRightMesh,
    backMesh,
    innerBayMesh,
    chipsInstanced,
    windowMesh,
    zipFront,
    zipBack,
    gussetMesh,
    hitMesh
  );

  return {
    root,
    hitMesh,
    shadowMesh,
    disposables: { geometries, materials, textures },
  };
}
