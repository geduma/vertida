import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('024 timer fixes: count-up from 0, donut fills with total time, recipe-scaled water, resume button', () => {
  const src = readFileSync('src/App.tsx', 'utf8');
  const hook = readFileSync('src/lib/useTimer.ts', 'utf8');

  it('big timer counts up from 0 starting at the first phase (total elapsed, no per-phase reset)', () => {
    expect(hook).toContain('totalElapsedMs');
    expect(hook).toContain('baseMs.current'); // finished phases accumulate, never reset mid-brew
    expect(src).toContain('data-testid="timer-elapsed"');
    expect(src).toContain('fmtMs(timer.totalElapsedMs)');
    expect(src).not.toContain('Math.ceil(timer.leftMs / 1000)'); // no countdown from phase duration
    expect(src).not.toContain('fmtMs(timer.elapsedMs)'); // no per-phase counter in the ring
  });

  it('donut fills according to total prep time, each phase contributing its own duration', () => {
    expect(src).toContain('(timer.totalElapsedMs / timer.totalDurationMs)');
  });

  it('recipe water data drives the brew screen and scales with selected cups', () => {
    expect(src).toContain('recipeWaterBaseG'); // 1 cup = recipe final water (e.g. v60: 240g)
    expect(src).toContain('waterScale');
    expect(src).toContain('scaledG(f.waterAccumulatedG)'); // preview scales phases
    expect(src).toContain('scaledG(fase.waterAccumulatedG)'); // running view scales phases
  });

  it('resume button renders only on paused state', () => {
    expect(src).toContain("timer.state === 'paused'");
    expect(src).toContain('data-testid="resume-btn"');
    expect(src).toContain('onClick={timer.resume}');
    expect(src).toContain("t('timer.resume')");
  });
});
