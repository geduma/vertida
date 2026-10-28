import { useEffect, useMemo, useRef, useState } from 'react';
import './theme/app.css';
import { CONFIG } from './config';
import { loadCatalog } from './lib/loadData';
import { calcCoffee, cupSizeG, cupsToWater, isRatioWarn, methodCupG } from './lib/calc';
import { useTimer } from './lib/useTimer';
import { loadEquipmentIds, persistStorage, saveEquipmentIds } from './lib/db';
import { PREF_KEYS, readFlag, readLang, readThemeMode, writeFlag, writePref, type ThemeMode } from './lib/prefs';
import { mapLegacyMethodId } from './lib/legacyIds';
import es from './i18n/es.json';
import en from './i18n/en.json';
import EquipmentModal from './components/EquipmentModal';
import EquipmentIcon from './components/EquipmentIcon';
import GitHubIcon from './components/GitHubIcon';
import TabIcon from './components/TabIcon';
import RecipeCreateModal from './components/RecipeCreateModal';
import DiscoveryModal from './components/DiscoveryModal';
import Landing from './components/Landing';
import UpdateDoneModal from './components/UpdateDoneModal';
import { useAppUpdate } from './lib/useAppUpdate';
import { createCustomRecipe, loadCustomRecipes, recipeDisplayName, saveCustomRecipes, type CustomRecipe } from './lib/customRecipes';
import { loadFavorites, saveFavorites, toggleFavorite } from './lib/favorites';

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
  const [lang, setLang] = useState<'es' | 'en'>(() => readLang(navigator.language.startsWith('en') ? 'en' : 'es'));
  const t = (k: string) => dicts[lang][k] ?? dicts.es[k] ?? k;
  const difficultyLabel = (d?: string) => {
    if (!d) return '';
    const slug = d.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return dicts[lang][`difficulty.${slug}`] ?? dicts.es[`difficulty.${slug}`] ?? d;
  };
  /** Data tags are stable English slugs; copy lives under `tag.<slug>` so the UI stays translated. */
  const tagLabel = (tag: string) => {
    const slug = tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return dicts[lang][`tag.${slug}`] ?? dicts.es[`tag.${slug}`] ?? tag;
  };
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const resolve = (): 'light' | 'dark' => (themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : themeMode);
    setResolvedTheme(resolve());
    document.documentElement.dataset.theme = resolve();
    writePref(PREF_KEYS.themeMode, themeMode);
    writePref(PREF_KEYS.theme, resolve());
    const onChange = () => {
      if (themeMode === 'auto') {
        const r = mq.matches ? 'dark' : 'light';
        setResolvedTheme(r);
        document.documentElement.dataset.theme = r;
        writePref(PREF_KEYS.theme, r);
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [themeMode]);
  useEffect(() => { writePref(PREF_KEYS.lang, lang); }, [lang]);
  const [tab, setTab] = useState<Tab>('home');
  const [originTab, setOriginTab] = useState<OriginTab>('home');
  const [equipmentIds, setEquipmentIds] = useState<string[]>([...CONFIG.equipment]);
  const [equipmentReady, setEquipmentReady] = useState(false);
  const equipmentTouched = useRef(false);
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
  const [advanced, setAdvanced] = useState(() => readFlag(PREF_KEYS.advanced));
  const [muted, setMuted] = useState(() => readFlag(PREF_KEYS.muted));
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
  const { state: updateState, check: checkUpdate, reset: resetUpdate } = useAppUpdate();
  const [updateDoneOpen, setUpdateDoneOpen] = useState(false);
  const updateBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (updateState === 'uptodate') setUpdateDoneOpen(true);
  }, [updateState]);

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
  const toggleEquipment = (id: string) => {
    equipmentTouched.current = true;
    setEquipmentIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleFav = (id: string) =>
    setFavIds(prev => { const next = toggleFavorite(prev, id); saveFavorites(next); return next; });
  const brewRecipe = (r: { id: string; methodId: string; ratio: number; coffeeDefaultG: number }, origin: OriginTab) => {
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

  useEffect(() => { // Hydrate the saved equipment selection once, before persisting anything
    let alive = true;
    void loadEquipmentIds()
      .then((saved) => {
        if (!alive || equipmentTouched.current || saved === null) return;
        const known = saved.map(mapLegacyMethodId).filter(id => cat.methods.some(m => m.id === id));
        // Nothing survives a data-version change: keep the defaults rather than an empty app.
        if (saved.length && !known.length) return;
        setEquipmentIds(known);
        if (known.length) {
          // Keep the brew screen on a method that is still selected.
          setMethodId(prev => (known.includes(prev) ? prev : known[0]));
          setRecipeId(prev => {
            const current = cat.recipes.find(r => r.id === prev);
            if (current && known.includes(current.methodId)) return prev;
            return cat.recipes.find(r => r.methodId === known[0])?.id ?? prev;
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setEquipmentReady(true); });
    return () => { alive = false; };
  }, [cat.methods]);
  useEffect(() => { // Persist equipment selection (including "nothing selected") after hydration
    if (!equipmentReady) return;
    void saveEquipmentIds(equipmentIds).catch(() => {});
  }, [equipmentIds, equipmentReady]);
  useEffect(() => { writeFlag(PREF_KEYS.advanced, advanced); }, [advanced]);
  useEffect(() => { writeFlag(PREF_KEYS.muted, muted); }, [muted]);
  useEffect(() => { void persistStorage(); }, []);
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

  // Brew is a destination without a tab, so the lens parks on the origin tab while the island is hidden.
  const activeTabIndex = Math.max(0, TABS.findIndex(x => x.id === tab));

  return (
    <div>
      {showLanding ? (
        <Landing t={t} onEnter={() => setShowLanding(false)} />
      ) : (
        <div className={`app${tab === 'brew' ? ' brew-flow' : ''}`}>
        <nav key={lang} className={`tabbar${tab === 'brew' ? ' is-hidden' : ''}`} role="tablist" aria-label={t('nav.label')}>
          <span
            className="tab-indicator"
            aria-hidden="true"
            style={{ '--active': activeTabIndex } as React.CSSProperties}
          />
          {TABS.map(({ id, labelKey }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); if (id === 'recipes') setFavOnly(false); setStep('summary'); }}>
              <span className="tab-icon" aria-hidden="true"><TabIcon id={id} /></span>
              <span className="tab-label">{t(labelKey)}</span>
            </button>
          ))}
        </nav>
        {tab === 'home' && (() => {
          const maxCups = Math.max(1, ...cat.methods.filter(m => equipmentIds.includes(m.id)).map(m => m.limits?.cupsMax ?? CONFIG.cupsMax));
          return (
            <section aria-label={t('nav.home')} className="home screen-enter">
              <div className="hero hero-home home-hero">
                <p className="hero-kicker">{t('home.suggested')}</p>
                <h2 className="home-greeting">{t('home.greeting')}</h2>
                {suggested ? (() => {
                  const sName = recipeDisplayName(suggested, t);
                  const sSecs = suggested.phases.reduce((a, f) => a + f.durationS, 0);
                  return (<>
                    <p className="hero-meta">{sName} · 1:{suggested.ratio} · {suggested.coffeeDefaultG}g · {t('recipe.minutes').replace('{min}', String(Math.max(1, Math.round(sSecs / 60))))}</p>
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
              <div className="home-scroll">
              <div className="surface home-stats">
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
              <div className="surface home-methods">
                <div className="section-head section-head-static">
                  <div><h2>{t('home.methods')}</h2></div>
                </div>
                <div className="method-row home-methods-scroll">{cat.methods.filter(m => equipmentIds.includes(m.id)).map(m => (
                  <button key={m.id} type="button" className="method-card" data-on="true" onClick={() => { setFilterMethodId(m.id); setTab('recipes'); }} aria-label={t(m.nameKey)}>
                    <span className="equip-icon" aria-hidden="true"><EquipmentIcon id={m.icon} size={30} /></span>
                    <span className="method-name">{t(m.nameKey)}</span>
                    <span className="hero-meta">{m.limits ? `${m.limits.cupsMax} · ${m.limits.waterMaxG}g` : ''}</span>
                    <span className="equip-check" aria-hidden="true">✓</span>
                  </button>
                ))}</div>
              </div>
              </div>
            </section>
          );
        })()}
        {tab === 'brew' && (
          <section aria-label={t('brew.section')} className="brew-section">
            {step === 'summary' && (
              <div className="brew-screen screen-enter">
                <div className="hero brew-header">
                  <button type="button" className="back-link" onClick={() => { timer.reset(); setTab(originTab); setStep('summary'); }}>‹ {t(originTab === 'home' ? 'nav.home' : originTab === 'recipes' ? 'nav.recipes' : 'nav.settings')}</button>
                  <h2>{recipeDisplayName(recipe, t)}</h2>
                  <p className="hero-meta">{t('brew.summaryMeta').replace('{coffee}', String(coffeeEff)).replace('{water}', String(water)).replace('{ratio}', String(ratioN)).replace('{phases}', String(recipe.phases.length)).replace('{min}', String(Math.round(totalTime / 60)))}</p>
                </div>
                <div className="surface screen-scroll">
                  <div className="grid-2">
                    <label>{t('brew.method')} <select value={methodId} onChange={e => { const nid = e.target.value; setMethodId(nid); const r = cat.recipes.find(x => x.methodId === nid); if (r) { setRecipeId(r.id); setCups(1); setRatio(r.ratio); } }}>{cat.methods.map(m => <option key={m.id} value={m.id}>{t(m.nameKey)}</option>)}</select></label>
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
                </div>
                <div className="screen-dock">
                  <button type="button" className="cta" onClick={() => setStep('preview')}>{t('app.start')}</button>
                </div>
              </div>
            )}
            {step === 'preview' && (
              <div className="brew-screen screen-enter">
                <div className="surface screen-scroll">
                  <h2>{t('brew.steps')} · {recipeDisplayName(recipe, t)}</h2>
                  <ol>{recipe.phases.map((f, i) => <li key={i} style={i === 0 ? { fontWeight: 800 } : {}}>{t(f.instructionKey)} — {scaledG(f.waterAccumulatedG)} g · {f.durationS}s {f.type === 'manual' ? `· ${t('phase.manual')}` : ''}</li>)}</ol>
                </div>
                <div className="screen-dock">
                  <button type="button" className="btn-secondary" onClick={() => setStep('summary')}>{t('app.back')}</button>
                  <button type="button" className="cta" onClick={() => { setStep('running'); timer.start(); }}>{t('app.start')}</button>
                </div>
              </div>
            )}
            {step === 'running' && (() => {
              const fase = recipe.phases[timer.idx] ?? recipe.phases[0];
              const faseNext = recipe.phases[timer.idx + 1];
              return (
              <div className="timer-screen screen-enter" aria-live="polite">
                <div className="surface timer-col">
                  <div className="phase-dots" aria-hidden="true">{recipe.phases.map((_, i) => <i key={i} className={i === timer.idx && phaseFlash ? 'dot-flash' : ''} data-on={i <= timer.idx ? 'true' : 'false'} />)}</div>
                  <div className="ring" style={{ ['--p' as string]: `${progress}%` }}><div><b data-testid="timer-elapsed">{fmtMs(timer.totalElapsedMs)}</b></div></div>
                  <h2 className="mega">{scaledG(fase.waterAccumulatedG)} g</h2>
                  <p><b>{t(fase.instructionKey)}</b> · {t('brew.phaseProgress').replace('{i}', String(Math.min(timer.idx + 1, recipe.phases.length))).replace('{n}', String(recipe.phases.length))}</p>
                  {faseNext && <p className="next">{t('brew.next')}: {t(faseNext.instructionKey)}</p>}
                </div>
                <div className="timer-dock">
                  <div className="timer-primary">
                    {timer.state === 'running' && <button type="button" className="cta" onClick={timer.pause}>{t('timer.pause')}</button>}
                    {timer.state === 'paused' && <button type="button" className="cta" data-testid="resume-btn" onClick={timer.resume}>{t('timer.resume')}</button>}
                    {timer.state === 'done' && <button type="button" className="cta" onClick={() => setStep('done')}>{t('timer.ready')}</button>}
                    {timer.state !== 'done' && <button type="button" className="btn-secondary" onClick={timer.skip}>{t('timer.skip')}</button>}
                  </div>
                  <div className="timer-secondary">
                    <button type="button" className="btn-secondary" onClick={() => setMuted(!muted)}>{muted ? t('timer.muteOn') : t('timer.muteOff')}</button>
                    <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); }}>{t('timer.reset')}</button>
                    <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); }}>{t('timer.cancel')}</button>
                  </div>
                </div>
              </div>
              );
            })()}
            {step === 'done' && (
              <div className="brew-screen screen-enter">
                <div className="surface screen-scroll">
                  <h2>{t('timer.ready')}</h2>
                  <p>{recipeDisplayName(recipe, t)} · {water} g</p>
                </div>
                <div className="screen-dock">
                  <button type="button" className="btn-secondary" onClick={() => { timer.reset(); setStep('summary'); setTab('brew'); }}>{t('brew.home')}</button>
                  <button type="button" className="cta" onClick={() => { timer.reset(); setStep('preview'); }}>{t('app.repeat')}</button>
                </div>
              </div>
            )}
          </section>
        )}
        {tab === 'recipes' && (
          <section className="surface recipes-screen screen-enter" aria-label={t('recipes.title')}>
            <div className="section-head">
              <div>
                <h2>{t('recipes.title')}</h2>
                <p className="hero-meta">{t('settings.equipmentSummary').replace('{n}', String(equipmentIds.length)).replace('{total}', String(cat.methods.length))}</p>
              </div>
              <button ref={createBtnRef} type="button" className="cta cta-compact" onClick={() => setCreateOpen(true)}>{t('recipes.new')}</button>
            </div>
            <div className="recipes-filters">
              <div className="recipes-filter-row">
                <div className="recipes-method-filter">
                  <span className="recipes-filter-label">{t('recipes.filterByMethod')}</span>
                  <div className="recipes-filter-bar">
                    <select
                      className="recipes-method-select"
                      value={filterMethodId ?? ''}
                      onChange={(e) => setFilterMethodId(e.target.value || null)}
                    >
                      <option value="">{t('recipes.methodAll')}</option>
                      {cat.methods
                        .filter((m) => equipmentIds.includes(m.id))
                        .sort((a, b) => a.order - b.order)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {t(m.nameKey)}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="btn-secondary btn-clear-filters"
                      onClick={() => {
                        setFilterMethodId(null);
                        setFavOnly(false);
                      }}
                      style={{ display: (filterMethodId || favOnly) ? 'inline-flex' : 'none' }}
                    >
                      {t('recipes.clearFilters')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="segmented recipes-filter" role="radiogroup" aria-label={t('recipes.title')}>
                <button type="button" role="radio" aria-checked={!favOnly} data-on={!favOnly ? 'true' : 'false'} onClick={() => { setFavOnly(false); }}>{t('recipes.all')}</button>
                <button type="button" role="radio" aria-checked={favOnly} data-on={favOnly ? 'true' : 'false'} onClick={() => setFavOnly(true)}>{t('recipes.favorites')}</button>
              </div>
            </div>
            <div className="list-scroll recipes-scroll">
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
              return (
                <div className="recipes-groups">
                  {groups.map(g => (
                    <div key={g.m.id} className="method-group">
                      <div className="method-group-head">
                        <span className="equip-icon equip-icon-sm" aria-hidden="true"><EquipmentIcon id={g.m.icon} size={28} /></span>
                        <h3>{t(g.m.nameKey)}</h3>
                        <p className="hero-meta">{g.items.length}</p>
                      </div>
                      <div className="recipe-grid">
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
                              onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); brewRecipe(r, 'recipes'); } }}
                            >
                              {m && <p className="hero-meta" style={{ opacity: 0.75 }}>{t(m.nameKey)}</p>}
                              <h3>{recipeDisplayName(r, t)}</h3>
                              <p className="hero-meta">{t('recipe.meta').replace('{ratio}', String(r.ratio)).replace('{coffee}', String(r.coffeeDefaultG)).replace('{phases}', String(r.phases.length)).replace('{min}', String(Math.max(1, Math.round(r.phases.reduce((a, f) => a + f.durationS, 0) / 60))))}{r.difficulty ? ` · ${difficultyLabel(r.difficulty)}` : ''}</p>
                              {(r as CustomRecipe).custom && (r as CustomRecipe).notes && <p className="next">{(r as CustomRecipe).notes}</p>}
                              {r.tags?.length ? <p className="next">{r.tags.map(tagLabel).join(' · ')}</p> : null}
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
            </div>
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
          <section className="surface list-scroll settings-section screen-enter" aria-label={t('settings.title')}>
            <h2 className="settings-title">{t('settings.title')}</h2>
            <div className="settings-body">
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.language')}</span></span><div className="segmented" role="radiogroup" aria-label={t('settings.language')}>{(['es', 'en'] as const).map(l => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} data-on={lang === l ? 'true' : 'false'} onClick={() => setLang(l)}>{l === 'es' ? 'ES' : 'EN'}</button>
            ))}</div></div>
            <div className="setting-row setting-row-theme"><span className="setting-label"><span className="setting-label-title">{t('settings.theme')}</span><small>{t('settings.themeDesc')}</small></span><div className="theme-ctl"><div className="segmented" role="radiogroup" aria-label={t('settings.theme')}>{(['light', 'dark', 'auto'] as ThemeMode[]).map(m => (
              <button key={m} type="button" role="radio" aria-checked={themeMode === m} data-on={themeMode === m ? 'true' : 'false'} onClick={() => setThemeMode(m)}>{m === 'light' ? t('settings.light') : m === 'dark' ? t('settings.dark') : t('settings.auto')}</button>
            ))}</div><small className="theme-current">{t('settings.themeCurrent')}: {themeMode === 'light' ? t('settings.light') : themeMode === 'dark' ? t('settings.dark') : `${t('settings.auto')} · ${resolvedTheme === 'dark' ? t('settings.dark') : t('settings.light')}`}</small></div></div>
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.advanced')}</span><small>{t('settings.advancedDesc')}</small></span><div className="segmented segmented-advanced" role="radiogroup" aria-label={t('settings.advanced')}>{[true, false].map(v => (
              <button key={String(v)} type="button" role="radio" aria-checked={advanced === v} data-on={advanced === v ? 'true' : 'false'} onClick={() => setAdvanced(v)}>{v ? t('common.on') : t('common.off')}</button>
            ))}</div></div>
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.equipment')}</span><small>{t('settings.equipmentSummary').replace('{n}', String(equipmentIds.length)).replace('{total}', String(cat.methods.length))}</small></span><button ref={equipBtnRef} type="button" className="btn-secondary btn-equip" onClick={() => setEquipOpen(true)}>{t('settings.equipmentChoose')}</button></div>
            <EquipmentModal
              open={equipOpen}
              methods={cat.methods}
              selected={equipmentIds}
              onToggle={toggleEquipment}
              onClose={() => setEquipOpen(false)}
              t={t}
              returnFocusRef={equipBtnRef}
            />
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.update')}</span><small data-testid="update-feedback" aria-live="polite">{updateState === 'checking' ? t('settings.updateChecking') : updateState === 'failed' ? t('settings.updateFailed') : updateState === 'unavailable' ? t('settings.updateUnavailable') : t('settings.updateDesc')}</small></span><button ref={updateBtnRef} data-testid="update-button" type="button" className="btn-secondary btn-update" disabled={updateState === 'checking'} onClick={() => void checkUpdate()}>{updateState === 'checking' ? <><span className="btn-spinner" aria-hidden="true" />{t('settings.updateChecking')}</> : t('settings.updateCta')}</button></div>
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.github')}</span><small>{t('settings.githubDesc')}</small></span><a className="github-link" data-testid="settings-github" href={CONFIG.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={t('settings.githubOpen')} title={t('settings.githubOpen')}><GitHubIcon /></a></div>
            <div className="setting-row"><span className="setting-label"><span className="setting-label-title">{t('settings.feedback')}</span><small>{t('settings.feedbackDesc')}</small></span><a className="btn-secondary btn-feedback" data-testid="settings-feedback" href={CONFIG.issuesUrl} target="_blank" rel="noopener noreferrer">{t('settings.feedbackCta')}</a></div>
            <div className="settings-footnote"><p className="next">{t('settings.localOnly')}</p></div>
            <div className="setting-row setting-row-version" data-testid="version-row"><span className="setting-label"><span className="setting-label-title">{t('settings.version')}</span></span><span className="hero-meta" data-testid="app-version">v{__APP_VERSION__}</span></div>
            <div className="setting-row setting-row-credits settings-footer"><a className="credit-link" data-testid="settings-credit" href={CONFIG.creditUrl} target="_blank" rel="noopener noreferrer">{t('app.credit')}</a></div>
            </div>
          </section>
        )}
            <UpdateDoneModal open={updateDoneOpen} version={`v${__APP_VERSION__}`} onClose={() => { setUpdateDoneOpen(false); resetUpdate(); }} t={t} returnFocusRef={updateBtnRef} />
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
