import { useEffect, useMemo, useRef, useState } from 'react';
import './theme/app.css';
import { CONFIG } from './config';
import { loadCatalog } from './lib/loadData';
import { calcCoffee, cupSizeG, cupsToWater, isRatioWarn, methodCupG } from './lib/calc';
import { useTimer } from './lib/useTimer';
import { db } from './lib/db';
import es from './i18n/es.json';
import en from './i18n/en.json';
import EquipmentModal from './components/EquipmentModal';
import EquipmentIcon from './components/EquipmentIcon';
import RecipeCreateModal from './components/RecipeCreateModal';
import DiscoveryModal from './components/DiscoveryModal';
import Landing from './components/Landing';
import { createCustomRecipe, loadCustomRecipes, recipeDisplayName, saveCustomRecipes, type CustomRecipe } from './lib/customRecipes';
import { loadFavorites, saveFavorites, toggleFavorite } from './lib/favorites';

type ThemeMode = 'light' | 'dark' | 'auto';

const dicts: Record<string, Record<string, string>> = { es, en };
type Tab = 'home' | 'brew' | 'recipes' | 'settings';
type OriginTab = 'home' | 'recipes' | 'settings';
type BrewStep = 'summary' | 'preview' | 'running' | 'done';

const TABS: { id: OriginTab; labelKey: string }[] = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'recipes', labelKey: 'nav.recipes' },
  { id: 'settings', labelKey: 'nav.settings' },
];

export default function App() {
  const cat = useMemo(() => loadCatalog(), []);
  const [lang, setLang] = useState<'es' | 'en'>(() => (navigator.language.startsWith('en') ? 'en' : 'es'));
  const t = (k: string) => dicts[lang][k] ?? dicts.es[k] ?? k;
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const m = localStorage.getItem('vertida-theme-mode') as ThemeMode | null;
    if (m === 'light' || m === 'dark' || m === 'auto') return m;
    const legacy = localStorage.getItem('vertida-theme') as 'light' | 'dark' | null;
    return legacy ?? 'auto';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const resolve = (): 'light' | 'dark' => (themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : themeMode);
    setResolvedTheme(resolve());
    document.documentElement.dataset.theme = resolve();
    localStorage.setItem('vertida-theme-mode', themeMode);
    localStorage.setItem('vertida-theme', resolve());
    const onChange = () => {
      if (themeMode === 'auto') {
        const r = mq.matches ? 'dark' : 'light';
        setResolvedTheme(r);
        document.documentElement.dataset.theme = r;
        localStorage.setItem('vertida-theme', r);
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [themeMode]);
  const [tab, setTab] = useState<Tab>('home');
  const [originTab, setOriginTab] = useState<OriginTab>('home');
  const [equipmentIds, setEquipmentIds] = useState<string[]>([...CONFIG.equipment]);
  const [methodId, setMethodId] = useState<string>(CONFIG.equipment[0]);
  const [filterMethodId, setFilterMethodId] = useState<string | null>(null);
  const [customs, setCustoms] = useState<CustomRecipe[]>(() => loadCustomRecipes());
  const [createOpen, setCreateOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const allClassics = useMemo(() => [...cat.recipes, ...customs], [cat, customs]);
  const [recipeId, setRecipeId] = useState(cat.recipes[0].id);
  const recipe = [...allClassics, ...cat.discovery].find(r => r.id === recipeId) ?? cat.recipes[0];
  const [cups, setCups] = useState<number>(1);
  const [ratio, setRatio] = useState<number | ''>(recipe.ratio);
  const [advanced, setAdvanced] = useState(false);
  const [muted, setMuted] = useState(false);
  const [phaseFlash, setPhaseFlash] = useState(false);
  const [step, setStep] = useState<BrewStep>('summary');
  const [equipOpen, setEquipOpen] = useState(false);
  const equipBtnRef = useRef<HTMLButtonElement>(null);
  const [favIds, setFavIds] = useState<string[]>(() => loadFavorites());
  const [favOnly, setFavOnly] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const timer = useTimer(recipe.phases, muted, recipeId);
  const lastIdxRef = useRef(timer.idx);

  const clampN = (v: number | '', min: number, max: number, fb: number) =>
    v === '' || !Number.isFinite(v) ? fb : Math.min(max, Math.max(min, v));
  const adjustRatio = (delta: number) =>
    setRatio((c) => clampN((c === '' ? ratioN : c) + delta, ratioMin, ratioMax, 16));
  const limitsFor = (id: string) => cat.methods.find(m => m.id === id)?.limits;
  const methodLimits = limitsFor(methodId);
  const cupsMax = methodLimits?.cupsMax ?? CONFIG.cupsMax;
  const waterMaxG = methodLimits?.waterMaxG ?? CONFIG.waterMaxG;
  const ratioMin = methodLimits?.ratioMin ?? 1;
  const ratioMax = methodLimits?.ratioMax ?? 50;
  // 1 cup = the method's own cup (waterMaxG ÷ cupsMax), capped at the recipe's
  // reference water so single-dose recipes keep their dose. Never clamps: cupsMax × cup ≤ waterMaxG.
  const recipeWaterBaseG = Math.max(1, ...recipe.phases.map(f => f.waterAccumulatedG));
  const cupG = cupSizeG(recipeWaterBaseG, methodLimits);
  const waterGN = clampN(cupsToWater(cups, cupG), 1, waterMaxG, Math.min(cupG, waterMaxG));
  const waterScale = waterGN / recipeWaterBaseG; // scales recipe phases to the selected cups
  const scaledG = (g: number) => Math.round(g * waterScale);
  const ratioN = clampN(ratio, ratioMin, ratioMax, 16);
  const water = waterGN;
  const coffeeEff = calcCoffee(water, ratioN);
  const totalTime = recipe.phases.reduce((a, f) => a + f.durationS, 0);
  const fmtMs = (v: number) => {
    const s = Math.max(0, Math.floor(v / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  const visible = [...allClassics, ...cat.discovery].filter(r => equipmentIds.includes(r.methodId));
  const visibleClassics = allClassics.filter(r => equipmentIds.includes(r.methodId));
  const toggleEquipment = (id: string) =>
    setEquipmentIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleFav = (id: string) =>
    setFavIds(prev => { const next = toggleFavorite(prev, id); saveFavorites(next); return next; });
  const brewRecipe = (r: { id: string; methodId: string; ratio: number; coffeeDefaultG: number }, origin: OriginTab) => {
    const lim = limitsFor(r.methodId);
    const wmax = lim?.waterMaxG ?? CONFIG.waterMaxG;
    setRecipeId(r.id); setMethodId(r.methodId);
    setCups(1);
    setRatio(r.ratio); setOriginTab(origin); setStep('summary'); setTab('brew');
  };
  const favKey = favIds.join(',');
  const equipKey = equipmentIds.join(',');
  const favPool = visibleClassics.filter(r => favIds.includes(r.id));
  const homePool = favPool.length ? favPool : visibleClassics;
  const suggestedRoll = useMemo(() => Math.random(), [favKey, equipKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const suggested = homePool.length ? homePool[Math.floor(suggestedRoll * homePool.length) % homePool.length] : undefined;
  const discoveryPool = cat.discovery.filter(r => equipmentIds.includes(r.methodId));
  const [surpriseId, setSurpriseId] = useState<string | null>(null);
  const pickSurprise = (exclude?: string | null) => {
    const pool = exclude ? discoveryPool.filter(r => r.id !== exclude) : discoveryPool;
    const src = pool.length ? pool : discoveryPool;
    return src.length ? src[Math.floor(Math.random() * src.length)].id : null;
  };
  const surprise = discoveryPool.find(r => r.id === surpriseId) ?? null;

  useEffect(() => { // Persist equipment selection
    db().then(d => equipmentIds.forEach(id => d.put('equipment', { id }))).catch(() => {});
  }, [equipmentIds]);
  useEffect(() => {
    if (timer.idx !== lastIdxRef.current) {
      lastIdxRef.current = timer.idx;
      setPhaseFlash(true);
      setTimeout(() => setPhaseFlash(false), 150);
    }
  }, [timer.idx]);

  const progress = timer.state === 'done' ? 100
    : timer.totalDurationMs > 0
      ? Math.min(99, Math.round((timer.totalElapsedMs / timer.totalDurationMs) * 100))
      : 0;

  return (
    <div>
      {showLanding ? (
        <Landing t={t} onEnter={() => setShowLanding(false)} />
      ) : (
        <div className={`app${tab === 'brew' && step === 'running' ? ' brew-running' : ''}`}>
        <nav key={lang} className={`tabbar${tab === 'brew' && step === 'running' ? ' is-hidden' : ''}`} role="tablist" aria-label={t('nav.label')}>
          {TABS.map(({ id, labelKey }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); if (id === 'recipes') setFavOnly(false); setStep('summary'); }}>{t(labelKey)}</button>
          ))}
        </nav>
        {tab === 'home' && (() => {
          const maxCups = Math.max(1, ...cat.methods.filter(m => equipmentIds.includes(m.id)).map(m => m.limits?.cupsMax ?? CONFIG.cupsMax));
          return (
            <section aria-label={t('nav.home')} className="home">
              <div className="hero hero-home">
                <p className="hero-meta">{t('home.suggested')}</p>
                <h2>{t('home.greeting')}</h2>
                {suggested ? (() => {
                  const sName = recipeDisplayName(suggested, t);
                  const sSecs = suggested.phases.reduce((a, f) => a + f.durationS, 0);
                  return (<>
                    <p className="hero-meta">{sName} · 1:{suggested.ratio} · {suggested.coffeeDefaultG}g · ~{Math.max(1, Math.round(sSecs / 60))} min</p>
                    <div className="form-actions">
                      <button type="button" className="cta" onClick={() => brewRecipe(suggested, 'home')}>{t('home.prepare')}: {sName}</button>
                    </div>
                  </>);
                })() : (<>
                  <p className="hero-meta">{t('recipes.empty')}</p>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setTab('settings')}>{t('settings.equipmentChoose')}</button>
                  </div>
                </>)}
              </div>
              <div className="surface">
                <div className="section-head section-head-static">
                  <div><h2>{t('home.methods')}</h2></div>
                </div>
                <div className="method-row">{cat.methods.filter(m => equipmentIds.includes(m.id)).map(m => (
                  <button key={m.id} type="button" className="method-card" data-on="true" onClick={() => { setFilterMethodId(m.id); setTab('recipes'); }} aria-label={t(m.nameKey)}>
                    <span className="equip-icon" aria-hidden="true"><EquipmentIcon id={m.icon} size={30} /></span>
                    <span className="method-name">{t(m.nameKey)}</span>
                    <span className="hero-meta">{m.limits ? `${m.limits.cupsMax} · ${m.limits.waterMaxG}g` : ''}</span>
                    <span className="equip-check" aria-hidden="true">●</span>
                  </button>
                ))}</div>
              </div>
              <div className="surface">
                <div className="stats-row">
                  <div className="stat"><b>{visibleClassics.length}</b><span>{t('home.statsRecipes')}</span></div>
                  <div className="stat"><b>{equipmentIds.length}/{cat.methods.length}</b><span>{t('home.statsMethods')}</span></div>
                  <div className="stat"><b>{maxCups}</b><span>{t('home.statsCups')}</span></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setFavOnly(false); setTab('recipes'); }}>{t('nav.recipes')}</button>
                  {discoveryPool.length
                    ? <button type="button" className="cta" onClick={() => { setSurpriseId(pickSurprise()); setDiscoveryOpen(true); }}>{t('home.discoverCta')}</button>
                    : <p className="next">{t('discover.empty')}</p>}
                </div>
              </div>
            </section>
          );
        })()}
        {tab === 'brew' && (
          <section aria-label={t('brew.section')}>
            {step === 'summary' && (
              <div className="brew-screen screen-enter">
                <div className="hero">
                  <button type="button" className="back-link" onClick={() => { timer.reset(); setTab(originTab); setStep('summary'); }}>‹ {t(originTab === 'home' ? 'nav.home' : originTab === 'recipes' ? 'nav.recipes' : 'nav.settings')}</button>
                  <h2>{recipeDisplayName(recipe, t)}</h2>
                  <p className="hero-meta">{coffeeEff} g · {water} g · 1:{ratioN} · {recipe.phases.length} phases · ~{Math.round(totalTime / 60)} min</p>
                </div>
                <div className="surface">
                  <div className="grid-2">
                    <label>{t('brew.method')} <select value={methodId} onChange={e => { const nid = e.target.value; setMethodId(nid); const r = cat.recipes.find(x => x.methodId === nid); if (r) { const lim = limitsFor(nid); const wmax = lim?.waterMaxG ?? CONFIG.waterMaxG; setRecipeId(r.id); setCups(1); setRatio(r.ratio); } }}>{cat.methods.map(m => <option key={m.id} value={m.id}>{t(m.nameKey)}</option>)}</select></label>
                    <label>{t('brew.recipe')} <select value={recipeId} onChange={e => setRecipeId(e.target.value)}>{visible.filter(r => r.methodId === methodId).map(r => <option key={r.id} value={r.id}>{recipeDisplayName(r, t)}</option>)}</select></label>
                  </div>
                  <div className="dosis-grid">
                    <label className="cups-label" style={{ gridColumn: '1 / -1' }}>
                      {t('calc.waterCups')}
                      <span className="next">{t('calc.cupsSelected').replace('{n}', String(cups))} · {t('calc.waterTotal').replace('{g}', String(waterGN))}</span>
                      <span className="cups-wrap">
                        {cupsMax === 1 ? (
                          <>
                            <div className="cups-bar-full" />
                            <span className="cups-thumb-end" aria-hidden="true" />
                          </>
                        ) : (
                          <input
                            type="range"
                            className="cups-slider"
                            min={1}
                            max={cupsMax}
                            step={1}
                            value={cups}
                            disabled={cupsMax === 1}
                            onChange={e => setCups(+e.target.value)}
                            style={{
                              '--fill': `${((cups - 1) / (cupsMax - 1)) * 100}%`
                            } as React.CSSProperties}
                          />
                        )}
                      </span>
                    </label>
                    <label className="ratio-label" style={{ gridColumn: '1 / -1' }}>
                      {t('calc.ratio').replace('N', String(ratioN))}
                      <div className="ratio-stepper">
                        <button
                          type="button"
                          onClick={() => adjustRatio(-0.5)}
                          disabled={ratioMin === ratioMax || ratioN <= ratioMin}
                          aria-label={t('calc.ratioMinus')}
                        >
                          -
                        </button>
                        <span className="ratio-value">{ratioN}</span>
                        <button
                          type="button"
                          onClick={() => adjustRatio(0.5)}
                          disabled={ratioMin === ratioMax || ratioN >= ratioMax}
                          aria-label={t('calc.ratioPlus')}
                        >
                          +
                        </button>
                      </div>
                    </label>
                  </div>
                  <div className="dosis-info">
                    <div className="info-item">
                      <span className="info-label">{t('method.limits')}</span>
                      <span className="info-value" data-testid="method-limit-hint">{t('method.limitHint').replace('{tazas}', String(cupsMax)).replace('{agua}', String(waterMaxG)).replace('{metodo}', t(cat.methods.find(m => m.id === methodId)?.nameKey ?? methodId))}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">{t('calc.coffee')}</span>
                      <span className="info-value" data-testid="coffee-from-water">{t('calc.coffeeFromWater').replace('{g}', String(coffeeEff))}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">{t('calc.waterCups')}</span>
                      <span className="info-value" data-testid="cup-eq">{t('calc.cupEq').replace('{g}', String(Math.round(cupG * 10) / 10))}</span>
                    </div>
                  </div>
                  {isRatioWarn(ratioN, ratioMin, ratioMax) && <p className="next warn-ratio"><b>{t('calc.warn-ratio')}</b></p>}
                  {advanced && <p className="next">{t('brew.retention')}: {(coffeeEff * CONFIG.retentionGramsPerGram).toFixed(0)} g ({t('brew.reference')})</p>}
                  <button type="button" className="cta" onClick={() => setStep('preview')}>{t('app.start')}</button>
                </div>
              </div>
            )}
            {step === 'preview' && (
              <div className="surface screen-enter">
                <h2>{t('brew.steps')} · {recipeDisplayName(recipe, t)}</h2>
                <ol>{recipe.phases.map((f, i) => <li key={i} style={i === 0 ? { fontWeight: 800 } : {}}>{t(f.instructionKey)} — {scaledG(f.waterAccumulatedG)} g · {f.durationS}s {f.type === 'manual' ? '· manual' : ''}</li>)}</ol>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep('summary')}>{t('app.back')}</button>
                  <button type="button" className="cta" onClick={() => { setStep('running'); timer.start(); }}>{t('app.start')}</button>
                </div>
              </div>
            )}
            {step === 'running' && (() => {
              const fase = recipe.phases[timer.idx] ?? recipe.phases[0];
              const faseNext = recipe.phases[timer.idx + 1];
              return (
              <div className="surface timer-col screen-enter" aria-live="polite">
                <div className="phase-dots" aria-hidden="true">{recipe.phases.map((_, i) => <i key={i} className={i === timer.idx && phaseFlash ? 'dot-flash' : ''} data-on={i <= timer.idx ? 'true' : 'false'} />)}</div>
                <div className="ring" style={{ ['--p' as string]: `${progress}%` }}><div><b data-testid="timer-elapsed">{fmtMs(timer.totalElapsedMs)}</b></div></div>
                <h2 className="mega">{scaledG(fase.waterAccumulatedG)} g</h2>
                <p><b>{t(fase.instructionKey)}</b> · phase {Math.min(timer.idx + 1, recipe.phases.length)}/{recipe.phases.length}</p>
                {faseNext && <p className="next">{t('brew.next')}: {t(faseNext.instructionKey)}</p>}
                <div className="timer-actions">
                  {timer.state === 'running' && <button type="button" className="cta" onClick={timer.pause}>{t('timer.pause')}</button>}
                  {timer.state === 'paused' && <button type="button" className="cta" data-testid="resume-btn" onClick={timer.resume}>{t('timer.resume')}</button>}
                  <button type="button" className="btn-secondary" onClick={timer.skip}>{t('timer.skip')}</button>
                  <button type="button" className="btn-secondary" onClick={() => setMuted(!muted)}>{t('timer.mute')}: {muted ? 'on' : 'off'}</button>
                  <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); }}>{t('timer.reset')}</button>
                  <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); }}>{t('timer.cancel')}</button>
                </div>
                {timer.state === 'done' && <button type="button" className="cta" onClick={() => setStep('done')}>{t('timer.ready')}</button>}
              </div>
              );
            })()}
            {step === 'done' && (
              <div className="surface screen-enter">
                <h2>{t('timer.ready')}</h2>
                <p>{recipeDisplayName(recipe, t)} · {water} g</p>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); setTab('brew'); }}>{t('brew.home')}</button>
                  <button type="button" className="cta" onClick={() => { timer.reset(); setStep('preview'); }}>{t('app.repeat')}</button>
                </div>
              </div>
            )}
          </section>
        )}
        {tab === 'recipes' && (
          <section className="surface" aria-label={t('recipes.title')}>
            <div className="section-head">
              <div>
                <h2>{t('recipes.title')}</h2>
                <p className="hero-meta">{t('settings.equipmentSummary').replace('{n}', String(equipmentIds.length)).replace('{total}', String(cat.methods.length))}</p>
                {filterMethodId && (
                  <p className="hero-meta">{t('recipes.filterBy').replace('{metodo}', t(cat.methods.find(m => m.id === filterMethodId)?.nameKey ?? filterMethodId))}</p>
                )}
              </div>
              <button ref={createBtnRef} type="button" className="cta cta-compact" onClick={() => setCreateOpen(true)}>{t('recipes.new')}</button>
            </div>
            <div className="segmented" role="radiogroup" aria-label={t('recipes.title')}>
              <button type="button" role="radio" aria-checked={!favOnly} data-on={!favOnly ? 'true' : 'false'} onClick={() => { setFilterMethodId(null); setFavOnly(false); }}>{t('recipes.all')}</button>
              <button type="button" role="radio" aria-checked={favOnly} data-on={favOnly ? 'true' : 'false'} onClick={() => setFavOnly(true)}>{t('recipes.favorites')}</button>
            </div>
            {(() => {
              const base = (favOnly ? visibleClassics.filter(r => favIds.includes(r.id)) : visibleClassics).filter(r => filterMethodId ? r.methodId === filterMethodId : true);
              if (base.length === 0)
                return favOnly
                  ? <p className="next">{t('recipes.emptyFav')}</p>
                  : <><p>{t('recipes.empty')}</p><button type="button" className="btn-secondary" onClick={() => setTab('settings')}>{t('settings.equipmentChoose')}</button></>;
              const groups = [...cat.methods]
                .sort((a, b) => a.order - b.order)
                .map(m => ({ m, items: base.filter(r => r.methodId === m.id).sort((a, b) => recipeDisplayName(a, t).localeCompare(recipeDisplayName(b, t), lang)) }))
                .filter(g => g.items.length > 0);
              const renderCard = (r: (typeof base)[number]) => {
                const m = cat.methods.find(x => x.id === r.methodId);
                const secs = r.phases.reduce((a, f) => a + f.durationS, 0);
                const isCustom = (r as CustomRecipe).custom === true;
                const name = recipeDisplayName(r, t);
                const goBrew = () => brewRecipe(r, 'recipes');
                return (
                  <article
                    key={r.id}
                    className="recipe-card"
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('brew.prepare')}: ${name}`}
                    onClick={goBrew}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBrew(); } }}
                  >
                    <h3>{name}</h3>
                    <p className="hero-meta">1:{r.ratio} · {r.coffeeDefaultG}g · {r.phases.length} phases · ~{Math.max(1, Math.round(secs / 60))} min{(r.difficulty ? ` · ${r.difficulty}` : '')}</p>
                    {isCustom && (r as CustomRecipe).notes && <p className="next">{(r as CustomRecipe).notes}</p>}
                    {r.tags?.length ? <p className="next">{r.tags.join(' · ')}</p> : null}
                    {isCustom && (
                      <div>
                        <button
                          type="button"
                          className="card-delete"
                          aria-label={`${t('recipes.delete')} ${name}`}
                          onClick={(e) => { e.stopPropagation(); const next = customs.filter(x => x.id !== r.id); setCustoms(next); saveCustomRecipes(next); }}
                        >{t('recipes.delete')}</button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="fav-btn"
                      data-on={favIds.includes(r.id) ? 'true' : 'false'}
                      aria-pressed={favIds.includes(r.id)}
                      aria-label={`${t('recipes.favorite')}: ${name}`}
                      onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }}
                    >{favIds.includes(r.id) ? '♥' : '♡'}</button>
                  </article>
                );
              };
              const cards = groups.flatMap(g => g.items);
              return (
                <div className="recipes-list">
                  {groups.map(g => (
                    <div key={g.m.id} className="method-group">
                      <div className="method-group-head">
                        <span className="equip-icon equip-icon-sm" aria-hidden="true"><EquipmentIcon id={g.m.icon} size={28} /></span>
                        <h3>{t(g.m.nameKey)}</h3>
                        <p className="hero-meta">{g.items.length}</p>
                      </div>
                      <div className="recipes-list">
                        {g.items.map(r => {
                          const m = cat.methods.find(x => x.id === r.methodId);
                          return (
                            <article
                              key={r.id}
                              className="recipe-card"
                              role="button"
                              tabIndex={0}
                              aria-label={`${t('brew.prepare')}: ${recipeDisplayName(r, t)}`}
                              onClick={() => brewRecipe(r, 'recipes')}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); brewRecipe(r, 'recipes'); } }}
                            >
                              {m && <p className="hero-meta" style={{ opacity: 0.75 }}>{t(m.nameKey)}</p>}
                              <h3>{recipeDisplayName(r, t)}</h3>
                              <p className="hero-meta">1:{r.ratio} · {r.coffeeDefaultG}g · {r.phases.length} phases · ~{Math.max(1, Math.round(r.phases.reduce((a, f) => a + f.durationS, 0) / 60))} min{(r.difficulty ? ` · ${r.difficulty}` : '')}</p>
                              {(r as CustomRecipe).custom && (r as CustomRecipe).notes && <p className="next">{(r as CustomRecipe).notes}</p>}
                              {r.tags?.length ? <p className="next">{r.tags.join(' · ')}</p> : null}
                              {(r as CustomRecipe).custom && (
                                <div>
                                  <button
                                    type="button"
                                    className="card-delete"
                                    aria-label={`${t('recipes.delete')} ${recipeDisplayName(r, t)}`}
                                    onClick={(e) => { e.stopPropagation(); const next = customs.filter(x => x.id !== r.id); setCustoms(next); saveCustomRecipes(next); }}
                                  >{t('recipes.delete')}</button>
                                </div>
                              )}
                              <button
                                type="button"
                                className="fav-btn"
                                data-on={favIds.includes(r.id) ? 'true' : 'false'}
                                aria-pressed={favIds.includes(r.id)}
                                aria-label={`${t('recipes.favorite')}: ${recipeDisplayName(r, t)}`}
                                onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }}
                              >{favIds.includes(r.id) ? '♥' : '♡'}</button>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <RecipeCreateModal
              open={createOpen}
              methods={cat.methods}
              t={t}
              returnFocusRef={createBtnRef}
              onClose={() => setCreateOpen(false)}
              onSave={(input) => {
                const lim = limitsFor(input.methodId);
                try {
                  const wmax = lim?.waterMaxG ?? CONFIG.waterMaxG;
                  const cmax = lim?.cupsMax ?? CONFIG.cupsMax;
                  const waterNeed = input.coffeeDefaultG * input.ratio;
                  if ((lim?.coffeeMaxG && input.coffeeDefaultG > lim.coffeeMaxG) || waterNeed > wmax || waterNeed / methodCupG(lim) > cmax + 1e-9) {
                    const mName = t(cat.methods.find(m => m.id === input.methodId)?.nameKey ?? input.methodId);
                    return t('method.limitHint').replace('{tazas}', String(cmax)).replace('{agua}', String(wmax)).replace('{metodo}', mName);
                  }
                  const created = createCustomRecipe(input);
                  const next = [...customs, created];
                  setCustoms(next);
                  saveCustomRecipes(next);
                  setRecipeId(created.id);
                  setMethodId(created.methodId);
                  setCups(1);
                  setRatio(created.ratio);
                  setOriginTab('recipes');
                  setStep('summary');
                  setTab('brew');
                  return null;
                } catch {
                  return t('error.coffee-range')
                    .replace('{min}', '1')
                    .replace('{max}', String(lim?.coffeeMaxG ?? CONFIG.coffeeMaxG));
                }
              }}
            />
          </section>
        )}
        {tab === 'settings' && (
          <section className="surface" aria-label={t('settings.title')}>
            <h2>{t('settings.title')}</h2>
            <div className="setting-row"><span className="setting-label">{t('settings.language')}</span><div className="segmented" role="radiogroup" aria-label={t('settings.language')}>{(['es', 'en'] as const).map(l => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} data-on={lang === l ? 'true' : 'false'} onClick={() => setLang(l)}>{l === 'es' ? 'ES' : 'EN'}</button>
            ))}</div></div>
            <div className="setting-row setting-row-theme"><span className="setting-label">{t('settings.theme')}<small>{t('settings.themeDesc')}</small></span><div className="theme-ctl"><div className="segmented" role="radiogroup" aria-label={t('settings.theme')}>{(['light', 'dark', 'auto'] as ThemeMode[]).map(m => (
              <button key={m} type="button" role="radio" aria-checked={themeMode === m} data-on={themeMode === m ? 'true' : 'false'} onClick={() => setThemeMode(m)}>{m === 'light' ? t('settings.light') : m === 'dark' ? t('settings.dark') : t('settings.auto')}</button>
            ))}</div><small className="theme-current">{t('settings.themeCurrent')}: {themeMode === 'light' ? t('settings.light') : themeMode === 'dark' ? t('settings.dark') : `${t('settings.auto')} · ${resolvedTheme === 'dark' ? t('settings.dark') : t('settings.light')}`}</small></div></div>
            <div className="setting-row"><span className="setting-label">{t('settings.advanced')}<small>{t('settings.advancedDesc')}</small></span><div className="segmented" role="radiogroup" aria-label={t('settings.advanced')}>{['On', 'Off'].map(v => (
              <button key={v} type="button" role="radio" aria-checked={advanced === (v === 'On')} data-on={advanced === (v === 'On') ? 'true' : 'false'} onClick={() => setAdvanced(v === 'On')}>{v}</button>
            ))}</div></div>
            <div className="setting-row"><span className="setting-label">{t('settings.equipment')}<small>{t('settings.equipmentSummary').replace('{n}', String(equipmentIds.length)).replace('{total}', String(cat.methods.length))}</small></span><button ref={equipBtnRef} type="button" className="btn-secondary" onClick={() => setEquipOpen(true)}>{t('settings.equipmentChoose')}</button></div>
            <EquipmentModal
              open={equipOpen}
              methods={cat.methods}
              selected={equipmentIds}
              onToggle={toggleEquipment}
              onClose={() => setEquipOpen(false)}
              t={t}
              returnFocusRef={equipBtnRef}
            />
            <div>
              <p className="next">{t('settings.localOnly')}</p>
            </div>
          </section>
        )}
        <DiscoveryModal
          recipe={discoveryOpen ? surprise : null}
          methodName={surprise ? t(cat.methods.find(m => m.id === surprise.methodId)?.nameKey ?? surprise.methodId) : ''}
          methodIcon={cat.methods.find(m => m.id === surprise?.methodId)?.icon ?? 'v60'}
          onClose={() => setDiscoveryOpen(false)}
          onBrew={() => { if (surprise) { setDiscoveryOpen(false); brewRecipe(surprise, 'home'); } }}
          onReroll={() => setSurpriseId(id => pickSurprise(id))}
          t={t}
        />
        </div>
      )}
    </div>
  );
}
