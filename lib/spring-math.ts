/**
 * Pure mathematical kinematics, second-order spring-damper solver,
 * golden-ratio incommensurate harmonics, and center-weighted fan layout math.
 * Zero DOM or WebGL dependencies so every invariant is unit-testable.
 */

export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export interface SpringState {
  value: number;
  velocity: number;
}

export interface SpringParams {
  /** Spring stiffness (k). Higher = faster response. */
  stiffness: number;
  /** Damping ratio (zeta). < 1 underdamped overshoot, 1 critically damped, > 1 overdamped. */
  dampingRatio: number;
  /** Effective mass (m). Defaults to 1. */
  mass?: number;
}

export const FOCUS_SPRING: SpringParams = {
  stiffness: 210,
  dampingRatio: 0.74,
  mass: 1,
};

export const FAN_SPRING: SpringParams = {
  stiffness: 175,
  dampingRatio: 0.86,
  mass: 1,
};

export const TILT_SPRING: SpringParams = {
  stiffness: 240,
  dampingRatio: 0.82,
  mass: 1,
};

export interface FanTarget {
  index: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  isFocused: boolean;
}

/**
 * Semi-implicit Euler integration of a second-order damped harmonic oscillator:
 *   x'' = (-k * (x - target) - c * x') / m
 * where c = 2 * zeta * sqrt(k * m).
 */
export function stepSpring(
  state: SpringState,
  target: number,
  params: SpringParams,
  rawDt: number
): SpringState {
  const dt = Math.min(Math.max(Number.isFinite(rawDt) ? rawDt : 0, 0), 0.04);
  if (dt === 0) return state;

  const mass = params.mass && params.mass > 0 ? params.mass : 1;
  const k = Math.max(params.stiffness, 0.001);
  const zeta = Math.max(params.dampingRatio, 0.05);
  const c = 2 * zeta * Math.sqrt(k * mass);

  // Sub-step at 1/120s max for crisp numerical stability under heavy frame spikes
  const subSteps = dt > 1 / 90 ? 2 : 1;
  const subDt = dt / subSteps;

  let value = state.value;
  let velocity = state.velocity;

  for (let s = 0; s < subSteps; s++) {
    const displacement = value - target;
    const force = -k * displacement - c * velocity;
    const accel = force / mass;
    velocity += accel * subDt;
    value += velocity * subDt;
  }

  return { value, velocity };
}

/**
 * Checks whether a spring oscillator has settled within tolerance.
 */
export function isSpringSettled(
  state: SpringState,
  target: number,
  epsilon = 0.0005
): boolean {
  return (
    Math.abs(target - state.value) <= epsilon &&
    Math.abs(state.velocity) <= epsilon * 4
  );
}

/**
 * Exponential angular velocity damping for drag-to-spin inertia:
 *   v(t + dt) = v(t) * exp(-decayRate * dt)
 */
export function decayVelocity(
  velocity: number,
  decayRatePerSec: number,
  rawDt: number
): number {
  const dt = Math.min(Math.max(Number.isFinite(rawDt) ? rawDt : 0, 0), 0.05);
  if (dt === 0) return velocity;
  const next = velocity * Math.exp(-Math.max(decayRatePerSec, 0) * dt);
  return Math.abs(next) < 0.0002 ? 0 : next;
}

/**
 * Shortest angular distance target so returning from a 360+ degree spin
 * resolves along the minimal arc rather than unwinding multiple turns.
 */
export function nearestAngleTarget(currentAngle: number, desiredAngle = 0): number {
  const twoPi = Math.PI * 2;
  const delta = ((((desiredAngle - currentAngle) % twoPi) + Math.PI * 3) % twoPi) - Math.PI;
  return currentAngle + delta;
}

/**
 * Golden-ratio phase offset per pouch index so idle breathing never synchronizes.
 */
export function goldenPhaseOffset(index: number): number {
  return index * ((Math.PI * 2) / GOLDEN_RATIO);
}

/**
 * Incommensurate multi-harmonic organic breathing wave:
 * frequencies scaled by {1, sqrt(2), phi} to eliminate cyclic repetition.
 */
export function computeHarmonicFloat(
  timeSec: number,
  index: number,
  isFocused: boolean
): { dy: number; dRoll: number; dPitch: number } {
  const phase = goldenPhaseOffset(index);
  const w1 = 1.35;
  const w2 = w1 * Math.SQRT2;
  const w3 = w1 * GOLDEN_RATIO;

  const ampY = isFocused ? 0.048 : 0.032;
  const ampRoll = isFocused ? 0.022 : 0.016;
  const ampPitch = isFocused ? 0.018 : 0.012;

  const dy =
    ampY *
    (0.68 * Math.sin(w1 * timeSec + phase) +
      0.32 * Math.cos(w2 * timeSec + phase * 1.3));
  const dRoll = ampRoll * Math.sin(w2 * timeSec + phase * 0.85);
  const dPitch = ampPitch * Math.cos(w3 * timeSec + phase * 1.15);

  return { dy, dRoll, dPitch };
}

/**
 * Center-weighted overlapping fan layout solver for N=4 pouches.
 * Keeps strict left-to-right ordering (0..3) while springing the focused bag
 * forward in Z, parting neighbors via mutual repulsion, and angling flankers inward.
 */
export function computeFanTargets(
  focusedIndex: number,
  count = 4,
  aspectRatio = 1.6
): FanTarget[] {
  const clampedFocus = Math.max(0, Math.min(count - 1, Math.round(focusedIndex)));
  // Slightly tighter overlap on narrower viewports while preserving full visibility
  const compactFactor = aspectRatio < 1.22 ? 0.68 : aspectRatio < 1.55 ? 0.86 : 1.0;
  const baseSpacing = 1.44 * compactFactor;
  const repulsionUnit = 0.28 * compactFactor;
  const centerBiasShift = -((clampedFocus - (count - 1) / 2) * baseSpacing) * 0.24;

  const targets: FanTarget[] = [];

  for (let i = 0; i < count; i++) {
    const slotOffset = i - (count - 1) / 2;
    const distSigned = i - clampedFocus;
    const absDist = Math.abs(distSigned);
    const isFocused = absDist === 0;

    // Mutual repulsion: focused bag clears space around itself while staying overlapped
    const repulsion =
      distSigned === 0
        ? 0
        : Math.sign(distSigned) * repulsionUnit * (1 + 0.16 * (absDist - 1));

    const x = slotOffset * baseSpacing + repulsion + centerBiasShift;
    const y = isFocused ? 0.1 : -0.05 * absDist;
    const z = isFocused ? 0.92 : -0.18 - (absDist - 1) * 0.42;
    const yaw = isFocused ? 0 : -Math.sign(distSigned) * (0.22 + (absDist - 1) * 0.08);
    const scale = isFocused ? 1.13 : Math.max(0.84, 0.97 - (absDist - 1) * 0.055);

    targets.push({
      index: i,
      x,
      y,
      z,
      yaw,
      scale,
      isFocused,
    });
  }

  return targets;
}

/**
 * Exact trigonometric frustum-fit camera Z distance so all 4 overlapping pouches
 * stay inside the visible horizontal bounds on any aspect ratio.
 */
export function computeResponsiveCameraZ(aspectRatio: number, fovDeg = 34): number {
  const safeAspect = Math.max(aspectRatio, 0.5);
  const tanHalfFov = Math.tan((fovDeg * Math.PI) / 360);
  const requiredHalfWidth = safeAspect < 1.22 ? 2.86 : 3.28;
  const fitZ = requiredHalfWidth / (tanHalfFov * safeAspect);
  return Math.max(5.55, Math.min(11.5, fitZ));
}
