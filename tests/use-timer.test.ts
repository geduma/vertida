import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimer } from '../src/lib/useTimer';
import type { Phase } from '../src/lib/schemas';

// 4s total recipe: 2s bloom, 1s pour, 1s manual (tap to advance), 0s done.
const phases: Phase[] = [
  { type: 'bloom', waterAccumulatedG: 30, durationS: 2, instructionKey: 'phase.bloom' },
  { type: 'pour', waterAccumulatedG: 120, durationS: 1, instructionKey: 'phase.pour' },
  { type: 'manual', waterAccumulatedG: 200, durationS: 1, instructionKey: 'phase.press' },
  { type: 'done', waterAccumulatedG: 200, durationS: 0, instructionKey: 'phase.done' },
];

function setup(muted = false, resetKey = 'r1') {
  return renderHook(({ muted, resetKey }) => useTimer(phases, muted, resetKey), {
    initialProps: { muted, resetKey },
  });
}

function advance(ms: number) {
  act(() => { vi.advanceTimersByTime(ms); });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimer initial state', () => {
  it('starts idle on the first phase with its full duration left', () => {
    const { result } = setup();
    expect(result.current.state).toBe('idle');
    expect(result.current.idx).toBe(0);
    expect(result.current.leftMs).toBe(2000);
    expect(result.current.totalDurationMs).toBe(4000);
    expect(result.current.totalElapsedMs).toBe(0);
  });
});

describe('useTimer run cycle', () => {
  it('start → running and counts down the current phase', () => {
    const { result } = setup();
    act(() => result.current.start());
    expect(result.current.state).toBe('running');
    advance(1000);
    expect(result.current.idx).toBe(0);
    // rAF ticks on a 16ms grid: remaining time lands within one frame of 1s.
    expect(result.current.leftMs).toBeGreaterThanOrEqual(980);
    expect(result.current.leftMs).toBeLessThanOrEqual(1008);
    expect(result.current.totalElapsedMs).toBeGreaterThanOrEqual(992);
    advance(1100); // cross the phase deadline
    expect(result.current.idx).toBe(1);
    expect(result.current.leftMs).toBeLessThanOrEqual(1000);
  });

  it('pause freezes the countdown and resume continues from the same point', () => {
    const { result } = setup();
    act(() => result.current.start());
    advance(1000);
    act(() => result.current.pause());
    expect(result.current.state).toBe('paused');
    expect(result.current.leftMs).toBe(1000); // pause reads the exact remaining deadline
    advance(5000); // wall time passes, phase does not
    expect(result.current.idx).toBe(0);
    expect(result.current.leftMs).toBe(1000);
    act(() => result.current.resume());
    expect(result.current.state).toBe('running');
    advance(1100); // remaining second completes the phase
    expect(result.current.idx).toBe(1);
    expect(result.current.totalElapsedMs).toBeGreaterThanOrEqual(2000); // finished phases accumulate
  });

  it('manual phases pause on entry and wait for a tap to continue', () => {
    const { result } = setup();
    act(() => result.current.start());
    advance(2050); // bloom ends → pour (one act per transition: renders must flush between ticks)
    expect(result.current.idx).toBe(1);
    advance(1050); // pour ends → manual entry pauses
    expect(result.current.idx).toBe(2);
    expect(result.current.state).toBe('paused');
    advance(2000); // stays paused, no countdown leak
    expect(result.current.idx).toBe(2);
    act(() => result.current.resume()); // confirming the manual step advances
    expect(result.current.idx).toBe(3);
    expect(result.current.state).toBe('running');
  });

  it('reaches done after the last phase and reports full elapsed time', () => {
    const { result } = setup();
    act(() => result.current.start());
    advance(2050); // → pour
    advance(1050); // → paused on the manual phase
    expect(result.current.state).toBe('paused');
    act(() => result.current.resume()); // confirm manual → done phase
    advance(100); // zero-duration done phase completes on the next tick
    expect(result.current.state).toBe('done');
    expect(result.current.totalElapsedMs).toBe(4000);
    expect(result.current.leftMs).toBe(0);
  });
});

describe('useTimer controls', () => {
  it('skip jumps to the next phase without waiting', () => {
    const { result } = setup();
    act(() => result.current.start());
    advance(500);
    act(() => result.current.skip());
    expect(result.current.idx).toBe(1);
    expect(result.current.leftMs).toBe(1000);
  });

  it('skipping past the last phase finishes the timer', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.skip()); // → 1
    act(() => result.current.skip()); // → 2 (manual)
    act(() => result.current.skip()); // → 3 (done)
    act(() => result.current.skip()); // past the end
    expect(result.current.state).toBe('done');
  });

  it('reset returns to idle on the first phase', () => {
    const { result } = setup();
    act(() => result.current.start());
    advance(2500);
    act(() => result.current.reset());
    expect(result.current.state).toBe('idle');
    expect(result.current.idx).toBe(0);
    expect(result.current.leftMs).toBe(2000);
    expect(result.current.totalElapsedMs).toBe(0);
  });

  it('changing resetKey (switching recipe) resets the timer', () => {
    const { result, rerender } = setup();
    act(() => result.current.start());
    advance(1000);
    rerender({ muted: false, resetKey: 'another-recipe' });
    expect(result.current.state).toBe('idle');
    expect(result.current.idx).toBe(0);
    expect(result.current.leftMs).toBe(2000);
  });

  it('muted runs do not crash on the notification beep', () => {
    const { result } = setup(true);
    act(() => result.current.start());
    advance(2100); // phase boundary triggers beep()
    expect(result.current.idx).toBe(1);
  });
});
