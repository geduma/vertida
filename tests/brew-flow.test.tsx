import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, methodsData, recipesData, stubRandom, tEs } from './helpers';
import { calcCoffee } from '../src/lib/calc';

vi.mock('../src/lib/db', () => ({
  loadEquipmentIds: async () => null,
  saveEquipmentIds: async () => undefined,
  persistStorage: async () => false,
}));

const v60 = recipesData.find(r => r.id === 'v60-clasica')!;
const aero = recipesData.find(r => r.id === 'aeropress-clasica')!;
const v60Name = tEs(v60.nameKey);
const aeroName = tEs(aero.nameKey);

const hint = (cups: string, water: string, method: string) =>
  tEs('method.limitHint').replace('{tazas}', cups).replace('{agua}', water).replace('{metodo}', method);

/** Method limits and recipe water straight from the data files (never hardcoded here). */
const limitsOf = (methodId: string) => methodsData.find(m => m.id === methodId)!.limits!;
const methodHint = (methodId: string) => {
  const l = limitsOf(methodId);
  return hint(String(l.cupsMax), String(l.waterMaxG), tEs(methodsData.find(m => m.id === methodId)!.nameKey));
};
const finalWater = (r: { phases: { waterAccumulatedG: number }[] }) => Math.max(...r.phases.map(p => p.waterAccumulatedG));
/** 1 cup = min(recipe reference water, method waterMaxG ÷ cupsMax) — App derives it from the data. */
const methodCup = (methodId: string) => { const l = limitsOf(methodId); return l.waterMaxG / l.cupsMax; };
const cupSize = (methodId: string, r: { phases: { waterAccumulatedG: number }[] }) => Math.min(finalWater(r), methodCup(methodId));
/** Phase water scales by selected cups: App's scaledG rounds the same way. */
const scaledWater = (methodId: string, r: { phases: { waterAccumulatedG: number }[] }, phaseWaterG: number) =>
  Math.round(phaseWaterG * (cupSize(methodId, r) / finalWater(r)));
const cupsLine = (cups: number, water: number) =>
  `${tEs('calc.cupsSelected').replace('{n}', String(cups))} · ${tEs('calc.waterTotal').replace('{g}', String(water))}`;

function goRecipes(): void {
  fireEvent.click(screen.getByRole('tab', { name: tEs('nav.recipes') }));
}

function brewCard(name: string): void {
  goRecipes();
  fireEvent.click(screen.getByRole('button', { name: `${tEs('brew.prepare')}: ${name}` }));
}

afterEach(() => vi.useRealTimers());

describe('brew summary (dose is water-derived)', () => {
  it('derives coffee from the method cup, ratio and method limits', () => {
    renderApp();
    brewCard(v60Name);
    const cup = cupSize('v60', v60); // min(240 g recipe base, 420 ÷ 2) = 210 g per cup
    expect(screen.getByTestId('coffee-from-water').textContent)
      .toBe(tEs('calc.coffeeFromWater').replace('{g}', String(calcCoffee(cup, v60.ratio))));
    expect(screen.getByTestId('method-limit-hint').textContent).toBe(methodHint('v60'));
    expect(screen.getByTestId('cup-eq').textContent).toBe(tEs('calc.cupEq').replace('{g}', String(cup)));
    expect(screen.getByText(cupsLine(1, cup))).toBeTruthy();
    expect(screen.getByRole('button', { name: `‹ ${tEs('nav.recipes')}` })).toBeTruthy();
  });

  it('the cups slider scales water by the method cup and never clamps', () => {
    renderApp();
    brewCard(v60Name);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    const limits = limitsOf('v60');
    expect(slider.min).toBe('1');
    expect(slider.max).toBe(String(limits.cupsMax));
    fireEvent.change(slider, { target: { value: String(limits.cupsMax) } });
    // 2 cups × 210 g = 420 g = the v60 waterMaxG exactly (source of truth: methods.json)
    const water = limits.cupsMax * cupSize('v60', v60);
    expect(water).toBeLessThanOrEqual(limits.waterMaxG);
    expect(screen.getByText(cupsLine(limits.cupsMax, water))).toBeTruthy();
    expect(screen.getByTestId('coffee-from-water').textContent)
      .toBe(tEs('calc.coffeeFromWater').replace('{g}', String(calcCoffee(water, v60.ratio))));
  });

  it('a single-cup method (aeropress) shows a fixed bar instead of a slider', () => {
    const { container } = renderApp();
    brewCard(aeroName);
    const water = cupSize('aeropress', aero); // recipe base 208 g stays under the 210 g method cup
    expect(screen.queryByRole('slider')).toBeNull();
    expect(container.querySelector('.cups-bar-full')).toBeTruthy();
    expect(screen.getByText(cupsLine(1, water))).toBeTruthy();
    expect(screen.getByTestId('coffee-from-water').textContent)
      .toBe(tEs('calc.coffeeFromWater').replace('{g}', String(calcCoffee(water, aero.ratio))));
    expect(screen.getByTestId('method-limit-hint').textContent).toBe(methodHint('aeropress'));
  });

  it('ratio +/- steps clamp to the method ratio limits and update the dose', () => {
    const { container } = renderApp();
    brewCard(v60Name);
    const cup = cupSize('v60', v60);
    const plus = screen.getByRole('button', { name: tEs('calc.ratioPlus') }) as HTMLButtonElement;
    const minus = screen.getByRole('button', { name: tEs('calc.ratioMinus') }) as HTMLButtonElement;
    const value = () => container.querySelector('.ratio-value')!.textContent;

    expect(value()).toBe('16'); // recipe default
    for (let i = 0; i < 10; i++) fireEvent.click(plus); // way past the max
    expect(value()).toBe('18'); // v60 ratioMax
    expect(plus.disabled).toBe(true);
    expect(screen.getByTestId('coffee-from-water').textContent)
      .toBe(tEs('calc.coffeeFromWater').replace('{g}', String(calcCoffee(cup, 18))));

    for (let i = 0; i < 20; i++) fireEvent.click(minus); // way past the min
    expect(value()).toBe('14'); // v60 ratioMin
    expect(minus.disabled).toBe(true);
  });

  it('retention reference stays hidden until Advanced is enabled', () => {
    renderApp();
    brewCard(v60Name);
    expect(screen.queryByText(new RegExp(tEs('brew.retention')))).toBeNull();
  });

  it('a method with its own ratio band (espresso) does not show the generic ratio warning', () => {
    const { container } = renderApp();
    const espressoName = tEs(recipesData.find(r => r.id === 'espresso-clasica')!.nameKey);
    brewCard(espressoName);
    // 1:2 sits inside the espresso band → the "outside this method range" copy must not render
    expect(screen.queryByText(tEs('calc.warn-ratio'))).toBeNull();
    expect(container.querySelector('.ratio-value')!.textContent).toBe('2');
  });
});

describe('brew preview', () => {
  it('lists every phase with scaled water and duration, and can go back', () => {
    renderApp();
    brewCard(v60Name);
    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') }));
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(v60.phases.length);
    // Phase water is scaled by the cups selection (1 cup = the method cup, 210 g for v60)
    expect(items[0].textContent).toContain(
      `${tEs(v60.phases[0].instructionKey)} — ${scaledWater('v60', v60, v60.phases[0].waterAccumulatedG)} g · ${v60.phases[0].durationS}s`
    );
    expect(items[2].textContent).toContain(`— ${scaledWater('v60', v60, v60.phases[2].waterAccumulatedG)} g · ${v60.phases[2].durationS}s`);
    expect(items[4].textContent).toContain(tEs('phase.done'));
    expect(items[4].textContent).toContain('0s');

    fireEvent.click(screen.getByRole('button', { name: tEs('app.back') }));
    expect(screen.getByRole('slider')).toBeTruthy(); // back to summary
  });
});

describe('brew running (timer)', () => {
  it('shows timer, phase dots, pause/resume, skip, mute and a working cancel', () => {
    const { container } = renderApp();
    brewCard(v60Name);
    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') }));
    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') })); // start brewing

    expect(screen.getByTestId('timer-elapsed').textContent).toBe('00:00');
    expect(container.querySelectorAll('.phase-dots i')).toHaveLength(v60.phases.length);
    expect(container.querySelector('h2.mega')!.textContent).toBe(`${scaledWater('v60', v60, v60.phases[0].waterAccumulatedG)} g`);
    expect(screen.getByRole('tablist').className).toContain('is-hidden'); // island hidden while running

    // pause ⇄ resume
    fireEvent.click(screen.getByRole('button', { name: tEs('timer.pause') }));
    expect(screen.getByTestId('resume-btn')).toBeTruthy();
    fireEvent.click(screen.getByTestId('resume-btn'));
    expect(screen.queryByTestId('resume-btn')).toBeNull();

    // skip advances to the next phase
    fireEvent.click(screen.getByRole('button', { name: tEs('timer.skip') }));
    expect(container.querySelector('h2.mega')!.textContent).toBe(`${scaledWater('v60', v60, v60.phases[1].waterAccumulatedG)} g`);
    expect(screen.getByText(new RegExp(`phase 2/${v60.phases.length}`))).toBeTruthy();

    // mute toggles
    fireEvent.click(screen.getByRole('button', { name: `${tEs('timer.mute')}: off` }));
    expect(screen.getByRole('button', { name: `${tEs('timer.mute')}: on` })).toBeTruthy();

    // cancel returns to the summary and unmutes the island
    fireEvent.click(screen.getByRole('button', { name: tEs('timer.cancel') }));
    expect(screen.getByRole('slider')).toBeTruthy();
    expect(screen.getByRole('tablist').className).not.toContain('is-hidden');
  });

  it('a full brew completes and the done screen offers repeat', () => {
    stubRandom();
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    renderApp();
    brewCard(v60Name);
    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') }));
    fireEvent.click(screen.getByRole('button', { name: tEs('app.start') }));

    // Phase durations come from the recipe: one act per phase transition (+0.5 s buffer).
    const d = v60.phases.map(p => p.durationS);
    const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const atPhase = (n: number) => new RegExp(`phase ${n}/${v60.phases.length}`);
    act(() => { vi.advanceTimersByTime((d[0] + 0.5) * 1000); });
    expect(screen.getByText(atPhase(2))).toBeTruthy();
    act(() => { vi.advanceTimersByTime((d[1] + 0.5) * 1000); });
    expect(screen.getByText(atPhase(3))).toBeTruthy();
    act(() => { vi.advanceTimersByTime((d[2] + 0.5) * 1000); });
    expect(screen.getByText(atPhase(4))).toBeTruthy();
    act(() => { vi.advanceTimersByTime((d[3] + 0.5) * 1000); }); // done phase entered
    act(() => { vi.advanceTimersByTime(100); });    // zero-length done completes
    expect(screen.getByTestId('timer-elapsed').textContent).toBe(clock(d.reduce((a, b) => a + b, 0)));

    fireEvent.click(screen.getByRole('button', { name: tEs('timer.ready') }));
    expect(screen.getByRole('heading', { level: 2, name: tEs('timer.ready') })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: tEs('app.repeat') }));
    expect(screen.getAllByRole('listitem')).toHaveLength(v60.phases.length); // back on the preview
  });

  it('the back link in the summary returns to the origin tab', () => {
    renderApp();
    brewCard(v60Name);
    fireEvent.click(screen.getByRole('button', { name: `‹ ${tEs('nav.recipes')}` }));
    expect(screen.getByRole('region', { name: tEs('recipes.title') })).toBeTruthy();
  });
});
