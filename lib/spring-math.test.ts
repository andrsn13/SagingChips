import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FAN_SPRING,
  FOCUS_SPRING,
  computeFanTargets,
  computeHarmonicFloat,
  computeResponsiveCameraZ,
  decayVelocity,
  goldenPhaseOffset,
  isSpringSettled,
  nearestAngleTarget,
  stepSpring,
  type SpringState,
} from './spring-math.ts';

test('stepSpring converges monotonically near critical damping without NaN', () => {
  let state: SpringState = { value: 0, velocity: 0 };
  for (let i = 0; i < 180; i++) {
    state = stepSpring(state, 1, FAN_SPRING, 1 / 60);
    assert.ok(Number.isFinite(state.value));
    assert.ok(Number.isFinite(state.velocity));
  }
  assert.ok(isSpringSettled(state, 1, 0.002));
});

test('FOCUS_SPRING (zeta < 1) exhibits subtle controlled overshoot before settling', () => {
  let state: SpringState = { value: 0, velocity: 0 };
  let maxVal = 0;
  for (let i = 0; i < 180; i++) {
    state = stepSpring(state, 1, FOCUS_SPRING, 1 / 60);
    if (state.value > maxVal) maxVal = state.value;
  }
  assert.ok(maxVal > 1.005 && maxVal < 1.15, `Unexpected overshoot peak: ${maxVal}`);
  assert.ok(isSpringSettled(state, 1, 0.005));
});

test('stepSpring safely clamps pathological frame dt spikes', () => {
  const next = stepSpring({ value: 0, velocity: 0 }, 2, FOCUS_SPRING, 5.0);
  assert.ok(Number.isFinite(next.value) && Math.abs(next.value) < 2.5);
});

test('decayVelocity attenuates angular velocity exponentially to zero', () => {
  let v = 6.0;
  for (let i = 0; i < 240; i++) {
    const prev = v;
    v = decayVelocity(v, 3.2, 1 / 60);
    assert.ok(v <= prev);
  }
  assert.equal(v, 0);
});

test('nearestAngleTarget picks shortest arc after full rotation', () => {
  const twoPi = Math.PI * 2;
  const target = nearestAngleTarget(twoPi + 0.25, 0);
  assert.ok(Math.abs(target - twoPi) < 1e-6);
});

test('golden-ratio phase offsets and harmonic floats remain distinct and bounded', () => {
  const phases = [0, 1, 2, 3].map((i) => goldenPhaseOffset(i) % (Math.PI * 2));
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      assert.ok(Math.abs(phases[i] - phases[j]) > 0.4);
    }
  }

  for (let t = 0; t < 20; t += 0.37) {
    const f = computeHarmonicFloat(t, 1, true);
    assert.ok(Math.abs(f.dy) <= 0.06);
    assert.ok(Math.abs(f.dRoll) <= 0.03);
    assert.ok(Math.abs(f.dPitch) <= 0.03);
  }
});

test('computeFanTargets keeps focused pouch strictly in front and left-to-right monotonic', () => {
  for (let focus = 0; focus < 4; focus++) {
    const targets = computeFanTargets(focus, 4, 1.6);
    assert.equal(targets.length, 4);

    const focused = targets[focus];
    assert.equal(focused.isFocused, true);

    for (let i = 0; i < 4; i++) {
      if (i !== focus) {
        assert.ok(focused.z > targets[i].z, `Focused z (${focused.z}) must exceed index ${i} (${targets[i].z})`);
        assert.ok(focused.scale > targets[i].scale, 'Focused pouch must have strictly largest scale');
      }
      if (i > 0) {
        assert.ok(targets[i].x > targets[i - 1].x, 'Left-to-right slot order must never invert');
      }
    }
  }
});

test('computeResponsiveCameraZ zooms out cleanly on narrow mobile viewports', () => {
  assert.ok(computeResponsiveCameraZ(0.75) > computeResponsiveCameraZ(1.6));
});
