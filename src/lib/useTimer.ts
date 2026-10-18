import { useCallback, useEffect, useRef, useState } from 'react';
import type { Phase } from './schemas';

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export function useTimer(phases: Phase[], muted: boolean, resetKey?: string) {
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [leftMs, setLeftMs] = useState((phases[0]?.durationS ?? 0) * 1000);
  const deadline = useRef(0);
  const raf = useRef(0);

  const beep = useCallback(() => {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      o.start();
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      o.stop(ctx.currentTime + 0.25);
      setTimeout(() => ctx.close(), 400);
      (navigator as any).vibrate?.(80);
    } catch {}
  }, [muted]);

  const tick = useCallback(() => {
    const left = deadline.current - Date.now();
    if (left <= 0) {
      beep();
      if (idx + 1 >= phases.length) {
        setState('done');
        setLeftMs(0);
        return;
      }
      const ni = idx + 1;
      // Manual waits for tap: pause on entry
      if (phases[ni].type === 'manual') {
        setIdx(ni);
        setLeftMs(phases[ni].durationS * 1000);
        setState('paused');
        return;
      }
      setIdx(ni);
      deadline.current = Date.now() + phases[ni].durationS * 1000;
      setLeftMs(phases[ni].durationS * 1000);
    } else {
      setLeftMs(left);
    }
    raf.current = requestAnimationFrame(tick);
  }, [idx, phases, beep]);

  useEffect(() => {
    if (state === 'running') {
      raf.current = requestAnimationFrame(tick);
      // Wake Lock
      (navigator as any).wakeLock?.request('screen').catch(() => {});
      const onVis = () => {
        // Recalculate on return: tick already uses Date.now, nothing to pause
        if (document.visibilityState === 'visible' && state === 'running') {
          setLeftMs(Math.max(0, deadline.current - Date.now()));
        }
      };
      document.addEventListener('visibilitychange', onVis);
      return () => {
        cancelAnimationFrame(raf.current);
        document.removeEventListener('visibilitychange', onVis);
      };
    }
    return () => cancelAnimationFrame(raf.current);
  }, [state, tick]);

  const start = () => {
    deadline.current = Date.now() + phases[0].durationS * 1000;
    setIdx(0);
    setLeftMs(phases[0].durationS * 1000);
    setState('running');
  };
  const pause = () => { setState('paused'); setLeftMs(Math.max(0, deadline.current - Date.now())); };
  const resume = () => {
    if (phases[idx].type === 'manual') { // Confirming a manual step advances
      const ni = idx + 1;
      if (ni >= phases.length) { setState('done'); return; }
      setIdx(ni);
      deadline.current = Date.now() + phases[ni].durationS * 1000;
    } else {
      deadline.current = Date.now() + leftMs;
    }
    setState('running');
  };
  const skip = () => {
    cancelAnimationFrame(raf.current);
    beep();
    if (idx + 1 >= phases.length) { setState('done'); return; }
    const ni = idx + 1;
    setIdx(ni);
    deadline.current = Date.now() + phases[ni].durationS * 1000;
    setLeftMs(phases[ni].durationS * 1000);
  };
  const reset = () => { cancelAnimationFrame(raf.current); setIdx(0); setState('idle'); setLeftMs(phases[0].durationS * 1000); };

  const resetKeyRef = useRef(resetKey);
  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      cancelAnimationFrame(raf.current);
      setIdx(0);
      setState('idle');
      setLeftMs((phases[0]?.durationS ?? 0) * 1000);
    }
  }, [resetKey, phases]);

  return { idx, state, leftMs, start, pause, resume, skip, reset };
}
