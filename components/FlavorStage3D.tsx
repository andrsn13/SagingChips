'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { FlavorItem } from '@/lib/catalog';
import type { FlavorId } from '@/lib/order-helpers';
import {
  FAN_SPRING,
  FOCUS_SPRING,
  TILT_SPRING,
  computeFanTargets,
  computeHarmonicFloat,
  computeResponsiveCameraZ,
  decayVelocity,
  nearestAngleTarget,
  stepSpring,
  type SpringState,
} from '@/lib/spring-math';
import {
  POUCH_HEIGHT,
  buildFlavorPouch,
  type PouchInstanceResources,
} from '@/lib/three/pouch-geometry';
import {
  createContactShadowTexture,
  createFoilCrinkleMaps,
  createStudioPhotoFrontTexture,
} from '@/lib/three/pouch-textures';

interface FlavorStage3DProps {
  flavors: readonly FlavorItem[];
  focusedIndex: number;
  resetSignal: number;
  prefersReducedMotion: boolean;
  onFocusIndex: (index: number) => void;
  onSpinStateChange: (isSpun: boolean) => void;
  onWebGLUnavailable: () => void;
}

interface PouchKinematicState {
  x: SpringState;
  y: SpringState;
  z: SpringState;
  fanYaw: SpringState;
  scale: SpringState;
  spinYaw: SpringState;
  spinPitch: SpringState;
  spinYawVel: number;
  spinTargetYaw: number | null;
}

function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugExt) return false;
    const rendererStr = String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

export function FlavorStage3D({
  flavors,
  focusedIndex,
  resetSignal,
  prefersReducedMotion,
  onFocusIndex,
  onSpinStateChange,
  onWebGLUnavailable,
}: FlavorStage3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const focusedIndexRef = useRef(focusedIndex);
  const resetSignalRef = useRef(resetSignal);
  const onFocusIndexRef = useRef(onFocusIndex);
  const onSpinStateChangeRef = useRef(onSpinStateChange);
  const onWebGLUnavailableRef = useRef(onWebGLUnavailable);

  const [cursorMode, setCursorMode] = useState<'default' | 'pointer' | 'grab' | 'grabbing'>('default');

  useEffect(() => {
    focusedIndexRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    resetSignalRef.current = resetSignal;
  }, [resetSignal]);

  useEffect(() => {
    onFocusIndexRef.current = onFocusIndex;
    onSpinStateChangeRef.current = onSpinStateChange;
    onWebGLUnavailableRef.current = onWebGLUnavailable;
  }, [onFocusIndex, onSpinStateChange, onWebGLUnavailable]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onWebGLUnavailableRef.current();
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL(renderer);
    if (isSoftwareGl) {
      renderer.dispose();
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch {
        onWebGLUnavailableRef.current();
        return;
      }
    }

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y';
    host.appendChild(canvas);

    const scene = new THREE.Scene();

    const width0 = Math.max(host.clientWidth, 320);
    const height0 = Math.max(host.clientHeight, 340);
    const aspect0 = width0 / height0;

    const camera = new THREE.PerspectiveCamera(34, aspect0, 0.1, 40);
    camera.position.set(0, 0.14, computeResponsiveCameraZ(aspect0));
    camera.lookAt(0, 0, 0);
    renderer.setSize(width0, height0, false);

    // Mandatory studio IBL via RoomEnvironment + PMREMGenerator
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.46;
    roomEnv.dispose();
    pmrem.dispose();

    // Three-point warm studio lighting rig angled to graze shoulder crinkles without blowing out center labels
    const hemiLight = new THREE.HemisphereLight(0xfff6e9, 0xc98c5b, 0.74);
    const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.08);
    keyLight.position.set(6.4, 5.4, 4.2);
    const fillLight = new THREE.DirectionalLight(0xfde6cf, 0.66);
    fillLight.position.set(-5.4, 2.8, 3.8);
    const rimLight = new THREE.DirectionalLight(0xf6c21c, 1.15);
    rimLight.position.set(0.4, 4.8, -5.6);
    scene.add(hemiLight, keyLight, fillLight, rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const { normalMap, roughnessMap } = createFoilCrinkleMaps(maxAnisotropy);
    const sharedShadowTex = createContactShadowTexture();

    const sharedAssets = {
      normalMap,
      roughnessMap,
      shadowTexture: sharedShadowTex,
    };

    const pouches: PouchInstanceResources[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    const uploadedStudioTextures: THREE.Texture[] = [];
    const initialTargets = computeFanTargets(focusedIndexRef.current, flavors.length, aspect0);

    const states: PouchKinematicState[] = flavors.map((flavor, idx) => {
      const built = buildFlavorPouch(
        flavor.id as FlavorId,
        idx,
        sharedAssets,
        isSoftwareGl,
        maxAnisotropy
      );
      const t = initialTargets[idx];
      built.root.position.set(t.x, t.y, t.z);
      built.root.rotation.set(0, t.yaw, 0);
      built.root.scale.setScalar(t.scale);
      built.shadowMesh.position.set(t.x, -POUCH_HEIGHT * 0.5 - 0.14, t.z);
      scene.add(built.root);
      scene.add(built.shadowMesh);
      pouches.push(built);
      hitMeshes.push(built.hitMesh);

      return {
        x: { value: t.x, velocity: 0 },
        y: { value: t.y, velocity: 0 },
        z: { value: t.z, velocity: 0 },
        fanYaw: { value: t.yaw, velocity: 0 },
        scale: { value: t.scale, velocity: 0 },
        spinYaw: { value: 0, velocity: 0 },
        spinPitch: { value: 0, velocity: 0 },
        spinYawVel: 0,
        spinTargetYaw: null,
      };
    });

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(0, 0);
    const pointerSmooth = {
      x: { value: 0, velocity: 0 } as SpringState,
      y: { value: 0, velocity: 0 } as SpringState,
      targetX: 0,
      targetY: 0,
      active: false,
    };

    let currentAspect = aspect0;
    let cameraZSpring: SpringState = { value: computeResponsiveCameraZ(aspect0), velocity: 0 };
    let isDragging = false;
    let dragDistancePx = 0;
    let dragLastX = 0;
    let dragLastY = 0;
    let dragFlavorIndex = focusedIndexRef.current;
    let activePointerId: number | null = null;
    let prevFocus = focusedIndexRef.current;
    let prevResetSignal = resetSignalRef.current;
    let lastReportedSpun = false;
    let contextLost = false;
    let disposed = false;
    let isVisibleInViewport = true;
    let rafId = 0;
    let lastTimeMs = performance.now();
    let elapsedSec = 0;

    // Async upgrade each pouch front albedo to cropped studio photography with zero pop-in
    flavors.forEach((flavor, idx) => {
      createStudioPhotoFrontTexture(
        flavor.image.src,
        flavor.id as FlavorId,
        maxAnisotropy
      ).then((studioTex) => {
        if (!studioTex) return;
        if (disposed || contextLost) {
          studioTex.dispose();
          return;
        }
        const targetPouch = pouches[idx];
        if (!targetPouch) {
          studioTex.dispose();
          return;
        }
        uploadedStudioTextures.push(studioTex);
        targetPouch.frontMaterial.map = studioTex;
        targetPouch.frontMaterial.needsUpdate = true;
        targetPouch.initialFrontTexture.dispose();
        if (prefersReducedMotion) {
          renderer.render(scene, camera);
        }
      });
    });

    const glCtx = renderer.getContext();
    const gl2 =
      typeof WebGL2RenderingContext !== 'undefined' && glCtx instanceof WebGL2RenderingContext
        ? glCtx
        : null;

    const updateNDCFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      pointerSmooth.targetX = THREE.MathUtils.clamp(pointerNDC.x, -1, 1);
      pointerSmooth.targetY = THREE.MathUtils.clamp(pointerNDC.y, -1, 1);
      pointerSmooth.active = true;
    };

    const hitTestPouch = (): number | null => {
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      if (hits.length === 0) return null;
      const idx = hits[0].object.userData?.flavorIndex;
      return typeof idx === 'number' ? idx : null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateNDCFromClient(event.clientX, event.clientY);

      if (isDragging) {
        const dx = event.clientX - dragLastX;
        const dy = event.clientY - dragLastY;
        dragLastX = event.clientX;
        dragLastY = event.clientY;
        dragDistancePx += Math.hypot(dx, dy);

        const st = states[dragFlavorIndex];
        if (st) {
          st.spinTargetYaw = null;
          st.spinYaw.value += dx * 0.012;
          st.spinYawVel = THREE.MathUtils.clamp(dx * 0.55, -10, 10);
          st.spinPitch.value = THREE.MathUtils.clamp(
            st.spinPitch.value + dy * 0.0055,
            -0.36,
            0.36
          );
          st.spinPitch.velocity = 0;
        }
        return;
      }

      const hitIdx = hitTestPouch();
      if (hitIdx !== null) {
        setCursorMode(hitIdx === focusedIndexRef.current ? 'grab' : 'pointer');
        if (event.pointerType === 'mouse' && hitIdx !== focusedIndexRef.current) {
          onFocusIndexRef.current(hitIdx);
        }
      } else {
        setCursorMode('default');
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      updateNDCFromClient(event.clientX, event.clientY);
      const hitIdx = hitTestPouch();
      if (hitIdx === null) return;

      dragFlavorIndex = hitIdx;
      if (hitIdx !== focusedIndexRef.current) {
        onFocusIndexRef.current(hitIdx);
      }

      isDragging = true;
      dragDistancePx = 0;
      dragLastX = event.clientX;
      dragLastY = event.clientY;
      activePointerId = event.pointerId;
      setCursorMode('grabbing');

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failure on synthetic test pointers
      }
    };

    const finishDrag = (event: PointerEvent) => {
      if (!isDragging) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;

      isDragging = false;
      activePointerId = null;

      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore
      }

      if (dragDistancePx < 5 && dragFlavorIndex === focusedIndexRef.current) {
        setCursorMode('grab');
      } else {
        const hitIdx = hitTestPouch();
        setCursorMode(hitIdx === focusedIndexRef.current ? 'grab' : hitIdx !== null ? 'pointer' : 'default');
      }
    };

    const handlePointerLeave = () => {
      if (!isDragging) {
        pointerSmooth.targetX = 0;
        pointerSmooth.targetY = 0;
        pointerSmooth.active = false;
        setCursorMode('default');
      }
    };

    const handleDoubleClick = () => {
      const st = states[focusedIndexRef.current];
      if (!st) return;
      st.spinYawVel = 0;
      st.spinTargetYaw = nearestAngleTarget(st.spinYaw.value, 0);
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      onWebGLUnavailableRef.current();
    };

    const handleContextRestored = () => {
      contextLost = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || disposed) return;
      const w = Math.max(Math.round(entry.contentRect.width), 300);
      const h = Math.max(Math.round(entry.contentRect.height), 320);
      currentAspect = w / h;
      camera.aspect = currentAspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisibleInViewport = entries[0]?.isIntersecting ?? true;
        if (isVisibleInViewport && !rafId && !disposed && !prefersReducedMotion) {
          lastTimeMs = performance.now();
          scheduleNextTick();
        }
      },
      { rootMargin: '180px' }
    );
    intersectionObserver.observe(host);

    const afterDraw = (next: () => void) => {
      if (disposed) return;
      if (!isSoftwareGl || !gl2) {
        rafId = requestAnimationFrame(next);
        return;
      }
      const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        rafId = requestAnimationFrame(next);
        return;
      }
      gl2.flush();
      const start = performance.now();
      const poll = () => {
        if (disposed) {
          gl2.deleteSync(sync);
          return;
        }
        const status = gl2.clientWaitSync(sync, 0, 0);
        if (status !== gl2.TIMEOUT_EXPIRED || performance.now() - start > 80) {
          gl2.deleteSync(sync);
          next();
        } else {
          rafId = requestAnimationFrame(poll);
        }
      };
      rafId = requestAnimationFrame(poll);
    };

    const renderFrame = (nowMs: number) => {
      if (disposed || contextLost) return;

      const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.04);
      lastTimeMs = nowMs;
      if (!prefersReducedMotion) {
        elapsedSec += dt;
      }

      const activeFocus = focusedIndexRef.current;

      if (activeFocus !== prevFocus) {
        states.forEach((st, idx) => {
          if (idx !== activeFocus && Math.abs(st.spinYaw.value) > 0.02) {
            st.spinYawVel = 0;
            st.spinTargetYaw = nearestAngleTarget(st.spinYaw.value, 0);
          }
        });
        prevFocus = activeFocus;
      }

      if (resetSignalRef.current !== prevResetSignal) {
        prevResetSignal = resetSignalRef.current;
        states.forEach((st) => {
          st.spinYawVel = 0;
          st.spinTargetYaw = nearestAngleTarget(st.spinYaw.value, 0);
        });
      }

      const targets = computeFanTargets(activeFocus, flavors.length, currentAspect);

      pointerSmooth.x = stepSpring(pointerSmooth.x, pointerSmooth.targetX, TILT_SPRING, dt);
      pointerSmooth.y = stepSpring(pointerSmooth.y, pointerSmooth.targetY, TILT_SPRING, dt);
      cameraZSpring = stepSpring(
        cameraZSpring,
        computeResponsiveCameraZ(currentAspect),
        FAN_SPRING,
        dt
      );

      camera.position.set(
        pointerSmooth.x.value * 0.14,
        0.13 + pointerSmooth.y.value * 0.07,
        cameraZSpring.value
      );
      camera.lookAt(0, 0.02, 0);

      let anySpun = false;

      for (let i = 0; i < pouches.length; i++) {
        const st = states[i];
        const t = targets[i];
        const springCfg = t.isFocused ? FOCUS_SPRING : FAN_SPRING;

        st.x = stepSpring(st.x, t.x, springCfg, dt);
        st.y = stepSpring(st.y, t.y, springCfg, dt);
        st.z = stepSpring(st.z, t.z, springCfg, dt);
        st.fanYaw = stepSpring(st.fanYaw, t.yaw, springCfg, dt);
        st.scale = stepSpring(st.scale, t.scale, springCfg, dt);

        const currentlyDraggingThis = isDragging && dragFlavorIndex === i;
        if (!currentlyDraggingThis) {
          if (st.spinTargetYaw !== null) {
            st.spinYaw = stepSpring(st.spinYaw, st.spinTargetYaw, FOCUS_SPRING, dt);
            if (Math.abs(st.spinTargetYaw - st.spinYaw.value) < 0.002 && Math.abs(st.spinYaw.velocity) < 0.01) {
              st.spinYaw = { value: 0, velocity: 0 };
              st.spinTargetYaw = null;
            }
          } else if (Math.abs(st.spinYawVel) > 0) {
            st.spinYaw.value += st.spinYawVel * dt;
            st.spinYawVel = decayVelocity(st.spinYawVel, 3.1, dt);
          }

          st.spinPitch = stepSpring(st.spinPitch, 0, TILT_SPRING, dt);
        }

        const modAngle = Math.abs(((st.spinYaw.value % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        if (t.isFocused && modAngle > 0.14) {
          anySpun = true;
        }

        const harmonic = prefersReducedMotion
          ? { dy: 0, dRoll: 0, dPitch: 0 }
          : computeHarmonicFloat(elapsedSec, i, t.isFocused);

        const tiltWeight = t.isFocused && !currentlyDraggingThis ? 1 : 0.25;
        const pointerPitch = -pointerSmooth.y.value * 0.075 * tiltWeight;
        const pointerYaw = pointerSmooth.x.value * 0.115 * tiltWeight;

        const pouch = pouches[i];
        pouch.root.position.set(st.x.value, st.y.value + harmonic.dy, st.z.value);
        pouch.root.rotation.set(
          st.spinPitch.value + harmonic.dPitch + pointerPitch,
          st.fanYaw.value + st.spinYaw.value + pointerYaw,
          harmonic.dRoll,
          'YXZ'
        );
        pouch.root.scale.setScalar(st.scale.value);

        const shadowScale = st.scale.value * (1 - Math.max(0, harmonic.dy) * 0.45);
        pouch.shadowMesh.position.set(st.x.value, -POUCH_HEIGHT * 0.5 - 0.14, st.z.value);
        pouch.shadowMesh.scale.set(shadowScale, shadowScale, 1);
      }

      if (anySpun !== lastReportedSpun) {
        lastReportedSpun = anySpun;
        onSpinStateChangeRef.current(anySpun);
      }

      renderer.render(scene, camera);
    };

    const scheduleNextTick = () => {
      if (disposed || contextLost || prefersReducedMotion || !isVisibleInViewport || document.hidden) {
        rafId = 0;
        return;
      }
      afterDraw(() => {
        if (disposed || contextLost || prefersReducedMotion || !isVisibleInViewport || document.hidden) {
          rafId = 0;
          return;
        }
        renderFrame(performance.now());
        scheduleNextTick();
      });
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isVisibleInViewport && !rafId && !disposed && !prefersReducedMotion) {
        lastTimeMs = performance.now();
        scheduleNextTick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    renderFrame(performance.now());
    if (!prefersReducedMotion) {
      scheduleNextTick();
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);

      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', finishDrag);
      canvas.removeEventListener('pointercancel', finishDrag);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      pouches.forEach((p) => {
        p.disposables.geometries.forEach((g) => g.dispose());
        p.disposables.materials.forEach((m) => m.dispose());
        p.disposables.textures.forEach((t) => t.dispose());
      });
      uploadedStudioTextures.forEach((t) => t.dispose());
      normalMap.dispose();
      roughnessMap.dispose();
      sharedShadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (canvas.parentElement === host) {
        host.removeChild(canvas);
      }
    };
  }, [flavors, prefersReducedMotion]);

  const cursorClass =
    cursorMode === 'grabbing'
      ? 'cursor-grabbing'
      : cursorMode === 'grab'
        ? 'cursor-grab'
        : cursorMode === 'pointer'
          ? 'cursor-pointer'
          : 'cursor-default';

  return (
    <div
      ref={hostRef}
      data-testid="flavors-3d-canvas-host"
      aria-label="Interactive 3D showcase of the four Saging Banana Chips pouches"
      className={`h-[340px] w-full select-none sm:h-[420px] lg:h-[470px] ${cursorClass}`}
    />
  );
}
