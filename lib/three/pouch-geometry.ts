import * as THREE from 'three';
import type { FlavorId } from '@/lib/order-helpers';
import {
  POUCH_PALETTES,
  createPouchBackTexture,
  createPouchFrontTexture,
} from './pouch-textures';

export const POUCH_WIDTH = 1.62;
export const POUCH_HEIGHT = 2.24;

/**
 * High-subdivision mathematical stand-up pouch profile with sculpted crinkle tension folds:
 * u in [-1, 1] (left to right), v in [0, 1] (bottom gusset to top heat seal).
 */
function evalPouchSurface(u: number, v: number, side: 1 | -1): [number, number, number] {
  const halfW = POUCH_WIDTH * 0.5;

  // Natural stand-up pouch silhouette: slight shoulder breadth, soft base rounding & die-cut corners
  const widthFactor = 0.935 + 0.065 * Math.sin(v * Math.PI * 0.86);
  const cornerRoundBot = v < 0.065 ? 1 - 0.048 * Math.pow(1 - v / 0.065, 1.3) : 1;
  const cornerRoundTop = v > 0.955 ? 1 - 0.028 * ((v - 0.955) / 0.045) : 1;
  const x = u * halfW * widthFactor * cornerRoundBot * cornerRoundTop;

  // Symmetrical V tear notches indented near v ≈ 0.925
  const notchDist = Math.abs(v - 0.925);
  const edgeWeight = Math.max(0, (Math.abs(u) - 0.92) / 0.08);
  const notchIndent = notchDist < 0.02 ? (1 - notchDist / 0.02) * 0.045 * edgeWeight : 0;
  const finalX = x - Math.sign(u) * notchIndent;

  const y = (v - 0.5) * POUCH_HEIGHT;

  // Side heat-seal seam pinch
  const seamTaper = Math.pow(Math.max(0, Math.cos((u * Math.PI) / 2)), 0.55);

  // Vertical pneumatic volume envelope: flat above zipper (v > 0.885), full belly & oval base gusset
  let vEnvelope = 0;
  if (v < 0.885) {
    const vn = v / 0.885;
    const belly = Math.sin(vn * Math.PI * 0.92);
    const gussetBase = Math.pow(1 - vn, 0.72) * 0.56;
    vEnvelope = Math.min(1, belly * 0.8 + gussetBase * 0.64);
  }

  // Subtle inward pinch along zipper line v ≈ 0.885
  const zipperPinch = 1 - 0.36 * Math.exp(-Math.pow((v - 0.885) / 0.02, 2));

  // Real physical 3D vertex crinkle folds (shoulder creases & bottom gusset pleats)
  const shoulderFold =
    v > 0.65 && v < 0.88
      ? Math.sin(Math.abs(u) * 11 - (0.88 - v) * 14) *
        0.008 *
        Math.pow(Math.abs(u), 1.2)
      : 0;
  const bottomPleat =
    v < 0.24
      ? Math.sin(u * 10) * 0.009 * (1 - v / 0.24) * seamTaper
      : 0;

  const zMag = 0.018 + 0.265 * seamTaper * vEnvelope * zipperPinch + shoulderFold + bottomPleat;
  return [finalX, y, side * zMag];
}

/**
 * Generates a high-poly (56x72) lofted BufferGeometry patch over full UV [0..1] x [0..1].
 */
function createPouchPatchGeometry(
  side: 1 | -1,
  uSegs = 56,
  vSegs = 72
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const cols = uSegs + 1;
  for (let iy = 0; iy <= vSegs; iy++) {
    const v = iy / vSegs;
    for (let ix = 0; ix <= uSegs; ix++) {
      const u = -1 + (2 * ix) / uSegs;
      const [px, py, pz] = evalPouchSurface(u, v, side);
      positions.push(px, py, pz);

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

/**
 * Builds a closed perimeter side-seam & top/bottom foil rim bridging front (+Z) and back (-Z)
 * edges so turning any bag sideways 90 degrees shows crisp physical thickness instead of a thin sheet.
 */
function createPouchPerimeterRimGeometry(uSegs = 40, vSegs = 72): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  const addRibbon = (ptsFront: [number, number, number][], ptsBack: [number, number, number][]) => {
    const baseIdx = positions.length / 3;
    for (let i = 0; i < ptsFront.length; i++) {
      positions.push(...ptsFront[i], ...ptsBack[i]);
    }
    for (let i = 0; i < ptsFront.length - 1; i++) {
      const f0 = baseIdx + i * 2;
      const b0 = f0 + 1;
      const f1 = f0 + 2;
      const b1 = f0 + 3;
      indices.push(f0, b0, b1, f0, b1, f1);
    }
  };

  // Right seam (u = +1, v: 0 -> 1)
  const rightF: [number, number, number][] = [];
  const rightB: [number, number, number][] = [];
  for (let iy = 0; iy <= vSegs; iy++) {
    const v = iy / vSegs;
    rightF.push(evalPouchSurface(1, v, 1));
    rightB.push(evalPouchSurface(1, v, -1));
  }
  addRibbon(rightF, rightB);

  // Left seam (u = -1, v: 1 -> 0)
  const leftF: [number, number, number][] = [];
  const leftB: [number, number, number][] = [];
  for (let iy = vSegs; iy >= 0; iy--) {
    const v = iy / vSegs;
    leftF.push(evalPouchSurface(-1, v, 1));
    leftB.push(evalPouchSurface(-1, v, -1));
  }
  addRibbon(leftF, leftB);

  // Top edge (v = 1, u: +1 -> -1)
  const topF: [number, number, number][] = [];
  const topB: [number, number, number][] = [];
  for (let ix = uSegs; ix >= 0; ix--) {
    const u = -1 + (2 * ix) / uSegs;
    topF.push(evalPouchSurface(u, 1, 1));
    topB.push(evalPouchSurface(u, 1, -1));
  }
  addRibbon(topF, topB);

  // Bottom oval gusset tuck (v = 0, u: -1 -> +1)
  const botF: [number, number, number][] = [];
  const botB: [number, number, number][] = [];
  for (let ix = 0; ix <= uSegs; ix++) {
    const u = -1 + (2 * ix) / uSegs;
    botF.push(evalPouchSurface(u, 0, 1));
    botB.push(evalPouchSurface(u, 0, -1));
  }
  addRibbon(botF, botB);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface PouchInstanceResources {
  root: THREE.Group;
  hitMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  frontMaterial: THREE.MeshPhysicalMaterial;
  initialFrontTexture: THREE.Texture;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

export interface SharedPouchAssets {
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
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
    normalMap: shared.normalMap,
    normalScale: new THREE.Vector2(0.48, 0.48),
    roughnessMap: shared.roughnessMap,
    metalness: palette.metalness * 0.72,
    roughness: palette.isMatteWhite ? 1.0 : 0.92,
    clearcoat: isSoftwareGl ? 0 : palette.clearcoat * 0.6,
    clearcoatRoughness: 0.3,
  });

  const backMat = new THREE.MeshPhysicalMaterial({
    map: backTex,
    normalMap: shared.normalMap,
    normalScale: new THREE.Vector2(0.48, 0.48),
    roughnessMap: shared.roughnessMap,
    metalness: palette.metalness * 0.72,
    roughness: palette.isMatteWhite ? 1.0 : 0.92,
    clearcoat: isSoftwareGl ? 0 : palette.clearcoat * 0.6,
    clearcoatRoughness: 0.3,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: palette.gussetHex,
    roughness: palette.roughness + 0.08,
    metalness: palette.metalness * 0.8,
  });

  materials.push(frontMat, backMat, rimMat);

  const frontGeo = createPouchPatchGeometry(1, 56, 72);
  const backGeo = createPouchPatchGeometry(-1, 56, 72);
  const rimGeo = createPouchPerimeterRimGeometry(40, 72);

  // Embossed zipper lock twin-ridge across front & back upper chest
  const zipRidgeGeo = new THREE.CapsuleGeometry(0.013, POUCH_WIDTH * 0.9, 4, 12);
  zipRidgeGeo.rotateZ(Math.PI / 2);

  geometries.push(frontGeo, backGeo, rimGeo, zipRidgeGeo);

  const frontMesh = new THREE.Mesh(frontGeo, frontMat);
  const backMesh = new THREE.Mesh(backGeo, backMat);
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);

  const zipFront = new THREE.Mesh(zipRidgeGeo, rimMat);
  zipFront.position.set(0, (0.885 - 0.5) * POUCH_HEIGHT, 0.022);
  const zipBack = new THREE.Mesh(zipRidgeGeo, rimMat);
  zipBack.position.set(0, (0.885 - 0.5) * POUCH_HEIGHT, -0.022);

  // Floor studio contact shadow disc
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

  // Invisible raycast hit volume covering the pouch footprint cleanly
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

  root.add(frontMesh, backMesh, rimMesh, zipFront, zipBack, hitMesh);

  return {
    root,
    hitMesh,
    shadowMesh,
    frontMaterial: frontMat,
    initialFrontTexture: frontTex,
    disposables: { geometries, materials, textures },
  };
}
