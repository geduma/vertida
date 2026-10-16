import { useEffect, useMemo, useRef, useState } from 'react';
import './theme/app.css';
import { CONFIG } from './config';
import { loadCatalog } from './lib/loadData';
import { calcCoffee, isRatioWarn } from './lib/calc';
import { useTimer } from './lib/useTimer';
import { db } from './lib/db';
import { exchangeSession, getProviders, getSession, logout, readCallbackToken, startLogin, type LocalSession } from './lib/auth';
import es from './i18n/es.json';
import en from './i18n/en.json';
import Toggle from './components/Toggle';
import Brand from './components/Brand';
import EquipmentModal from './components/EquipmentModal';
import EquipmentIcon from './components/EquipmentIcon';
import RecipeCreateModal from './components/RecipeCreateModal';
import DiscoveryModal from './components/DiscoveryModal';
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
  useEffect(() => {
    const tk = readCallbackToken();
    if (tk) exchangeSession(tk).then(setSession).catch(() => setAuthErr(true));
    getSession().then(s => s && setSession(s));
  }, []);

  const [tab, setTab] = useState<Tab>('home');
  const [originTab, setOriginTab] = useState<OriginTab>('home');
  const [equipmentIds, setEquipmentIds] = useState<string[]>([...CONFIG.equipment]);
  const [methodId, setMethodId] = useState<string>(CONFIG.equipment[0]);
  const [customs, setCustoms] = useState<CustomRecipe[]>(() => loadCustomRecipes());
  const [createOpen, setCreateOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const allClassics = useMemo(() => [...cat.recipes, ...customs], [cat, customs]);
  const [recipeId, setRecipeId] = useState(cat.recipes[0].id);
  const recipe = [...allClassics, ...cat.discovery].find(r => r.id === recipeId) ?? cat.recipes[0];
  const [waterG, setWaterG] = useState<number | ''>(recipe.cafeDefaultG * recipe.ratio);
  const [ratio, setRatio] = useState<number | ''>(recipe.ratio);
  const [advanced, setAdvanced] = useState(false);
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState<BrewStep>('summary');
  const [session, setSession] = useState<LocalSession | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [authErr, setAuthErr] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);
  const equipBtnRef = useRef<HTMLButtonElement>(null);
  const [favIds, setFavIds] = useState<string[]>(() => loadFavorites());
  const [favOnly, setFavOnly] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const timer = useTimer(recipe.fases, muted, recipeId);

  const clampN = (v: number | '', min: number, max: number, fb: number) =>
    v === '' || !Number.isFinite(v) ? fb : Math.min(max, Math.max(min, v));
  const limitsFor = (id: string) => cat.methods.find(m => m.id === id)?.limites;
  const methodLimits = limitsFor(methodId);
  const cupsMax = methodLimits?.tazasMax ?? CONFIG.cupsMax;
  const waterMaxG = methodLimits?.aguaMaxG ?? CONFIG.waterMaxG;
  const ratioMin = methodLimits?.ratioMin ?? 1;
  const ratioMax = methodLimits?.ratioMax ?? 50;
  const waterGN = clampN(waterG, 1, waterMaxG, Math.min(240, waterMaxG));
  const ratioN = clampN(ratio, ratioMin, ratioMax, 16);
  const water = waterGN;
  const coffeeEff = calcCoffee(water, ratioN);
  const totalTime = recipe.fases.reduce((a, f) => a + f.duracionS, 0);
  const visible = [...allClassics, ...cat.discovery].filter(r => equipmentIds.includes(r.methodId));
  const visibleClassics = allClassics.filter(r => equipmentIds.includes(r.methodId));
  const toggleEquipment = (id: string) =>
    setEquipmentIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleFav = (id: string) =>
    setFavIds(prev => { const next = toggleFavorite(prev, id); saveFavorites(next); return next; });
  const brewRecipe = (r: { id: string; methodId: string; ratio: number; cafeDefaultG: number }, origin: OriginTab) => {
    const lim = limitsFor(r.methodId);
    const wmax = lim?.aguaMaxG ?? CONFIG.waterMaxG;
    setRecipeId(r.id); setMethodId(r.methodId);
    setWaterG(Math.min(r.cafeDefaultG * r.ratio, wmax));
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
    getProviders().then(setProviders).catch(() => {});
  }, []);

  const progress = timer.state === 'done' ? 100 : Math.min(99, Math.round(((totalTime * 1000 - timer.leftMs) / (totalTime * 1000 || 1)) * 100));

  return (
    <div>
      <div className="app">
        <Brand compact={tab === 'brew' && step === 'running'} />
        <nav key={lang} className={`tabbar${tab === 'brew' && step === 'running' ? ' is-hidden' : ''}`} role="tablist" aria-label={t('nav.label')}>
          {TABS.map(({ id, labelKey }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); if (id === 'recipes') setFavOnly(false); setStep('summary'); }}>{t(labelKey)}</button>
          ))}
        </nav>
        {tab === 'home' && (() => {
          const maxCups = Math.max(1, ...cat.methods.filter(m => equipmentIds.includes(m.id)).map(m => m.limites?.tazasMax ?? CONFIG.cupsMax));
          return (
            <section aria-label={t('nav.home')} className="home">
              <div className="hero hero-home">
                <p className="hero-meta">{t('home.suggested')}</p>
                <h2>{t('home.greeting')}</h2>
                {suggested ? (() => {
                  const sName = recipeDisplayName(suggested, t);
                  const sSecs = suggested.fases.reduce((a, f) => a + f.duracionS, 0);
                  return (<>
                    <p className="hero-meta">{sName} · 1:{suggested.ratio} · {suggested.cafeDefaultG}g · ~{Math.max(1, Math.round(sSecs / 60))} min</p>
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
                  <button key={m.id} type="button" className="method-card" data-on="true" onClick={() => setTab('recipes')} aria-label={t(m.nombreKey)}>
                    <span className="equip-icon" aria-hidden="true"><EquipmentIcon id={m.icono} size={30} /></span>
                    <span className="method-name">{t(m.nombreKey)}</span>
                    <span className="hero-meta">{m.limites ? `${m.limites.tazasMax} · ${m.limites.aguaMaxG}g` : ''}</span>
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
              <>
                <div className="hero">
                  <button type="button" className="back-link" onClick={() => { timer.reset(); setTab(originTab); setStep('summary'); }}>‹ {t(originTab === 'home' ? 'nav.home' : originTab === 'recipes' ? 'nav.recipes' : 'nav.settings')}</button>
                  <h2>{recipeDisplayName(recipe, t)}</h2>
                  <p className="hero-meta">{coffeeEff} g · {water} g · 1:{ratioN} · {recipe.fases.length} phases · ~{Math.round(totalTime / 60)} min</p>
                </div>
                <div className="surface">
                  <div className="grid-2">
                    <label>{t('brew.method')} <select value={methodId} onChange={e => { const nid = e.target.value; setMethodId(nid); const r = cat.recipes.find(x => x.methodId === nid); if (r) { const lim = limitsFor(nid); const wmax = lim?.aguaMaxG ?? CONFIG.waterMaxG; setRecipeId(r.id); setWaterG(Math.min(r.cafeDefaultG * r.ratio, wmax)); setRatio(r.ratio); } }}>{cat.methods.map(m => <option key={m.id} value={m.id}>{t(m.nombreKey)}</option>)}</select></label>
                    <label>{t('brew.recipe')} <select value={recipeId} onChange={e => setRecipeId(e.target.value)}>{visible.filter(r => r.methodId === methodId).map(r => <option key={r.id} value={r.id}>{recipeDisplayName(r, t)}</option>)}</select></label>
                  </div>
                  <div className="dosis-grid">
                    <label>{t('calc.water')}<input type="number" value={waterG} min={1} max={waterMaxG} step={1} disabled={waterMaxG === 1} onChange={e => setWaterG(e.target.value === '' ? '' : +e.target.value)} onBlur={() => setWaterG(c => clampN(c, 1, waterMaxG, Math.min(240, waterMaxG)))} /><span className="next">{t('calc.cupEq')}</span></label>
                    <label>{t('calc.ratio')}<input type="number" value={ratio} min={ratioMin} max={ratioMax} step={0.5} disabled={ratioMin === ratioMax} onChange={e => setRatio(e.target.value === '' ? '' : +e.target.value)} onBlur={() => setRatio(r => clampN(r, ratioMin, ratioMax, 16))} /></label>
                  </div>
                  <p className="next" data-testid="method-limit-hint">{t('method.limitHint').replace('{tazas}', String(cupsMax)).replace('{agua}', String(waterMaxG)).replace('{metodo}', t(cat.methods.find(m => m.id === methodId)?.nombreKey ?? methodId))}</p>
                  <p className="next" data-testid="coffee-from-water">{t('calc.coffeeFromWater').replace('{g}', String(coffeeEff))}</p>
                  {isRatioWarn(ratioN) && <p><b>{t('calc.warn-ratio')}</b></p>}
                  {advanced && <p className="hero-meta">{t('brew.retention')}: {(coffeeEff * CONFIG.retentionGramsPerGram).toFixed(0)} g ({t('brew.reference')})</p>}
                  <button type="button" className="cta" onClick={() => setStep('preview')}>{t('app.start')}</button>
                </div>
              </>
            )}
            {step === 'preview' && (
              <div className="surface">
                <button type="button" className="back-link" onClick={() => setStep('summary')}>‹ {t('app.back')}</button>
                <h2>{t('brew.steps')} · {recipeDisplayName(recipe, t)}</h2>
                <ol>{recipe.fases.map((f, i) => <li key={i} style={i === 0 ? { fontWeight: 800 } : {}}>{t(f.instruccionKey)} — {f.aguaAcumuladaG} g · {f.duracionS}s {f.tipo === 'manual' ? '· manual' : ''}</li>)}</ol>
                <div className="form-actions">
                  <button type="button" className="cta" onClick={() => { setStep('running'); timer.start(); }}>{t('app.start')}</button>
                </div>
              </div>
            )}
            {step === 'running' && (() => {
              const fase = recipe.fases[timer.idx] ?? recipe.fases[0];
              const faseNext = recipe.fases[timer.idx + 1];
              return (
              <div className="surface timer-col" aria-live="polite">
                <button type="button" className="back-link" onClick={() => { timer.reset(); setStep('summary'); }}>‹ {t('brew.recipe')}</button>
                <div className="phase-dots" aria-hidden="true">{recipe.fases.map((_, i) => <i key={i} data-on={i <= timer.idx ? 'true' : 'false'} />)}</div>
                <div className="ring" style={{ ['--p' as string]: `${progress}%` }}><div><b>{Math.ceil(timer.leftMs / 1000)}s</b></div></div>
                <h2 className="mega">{fase.aguaAcumuladaG} g</h2>
                <p><b>{t(fase.instruccionKey)}</b> · phase {Math.min(timer.idx + 1, recipe.fases.length)}/{recipe.fases.length}</p>
                {faseNext && <p className="next">{t('brew.next')}: {t(faseNext.instruccionKey)}</p>}
                <div className="timer-actions">
                  <button type="button" className="cta" onClick={() => timer.state === 'running' ? timer.pause() : timer.resume()}>{timer.state === 'running' ? t('timer.pause') : t('timer.resume')}</button>
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
              <div className="surface">
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
              </div>
              <button ref={createBtnRef} type="button" className="cta cta-compact" onClick={() => setCreateOpen(true)}>{t('recipes.new')}</button>
            </div>
            <div className="segmented" role="radiogroup" aria-label={t('recipes.title')}>
              <button type="button" role="radio" aria-checked={!favOnly} data-on={!favOnly ? 'true' : 'false'} onClick={() => setFavOnly(false)}>{t('recipes.all')}</button>
              <button type="button" role="radio" aria-checked={favOnly} data-on={favOnly ? 'true' : 'false'} onClick={() => setFavOnly(true)}>{t('recipes.favorites')}</button>
            </div>
            {(() => {
              const base = favOnly ? visibleClassics.filter(r => favIds.includes(r.id)) : visibleClassics;
              if (base.length === 0)
                return favOnly
                  ? <p className="next">{t('recipes.emptyFav')}</p>
                  : <><p>{t('recipes.empty')}</p><button type="button" className="btn-secondary" onClick={() => setTab('settings')}>{t('settings.equipmentChoose')}</button></>;
              const groups = [...cat.methods]
                .sort((a, b) => a.orden - b.orden)
                .map(m => ({ m, items: base.filter(r => r.methodId === m.id).sort((a, b) => recipeDisplayName(a, t).localeCompare(recipeDisplayName(b, t), lang)) }))
                .filter(g => g.items.length > 0);
              const renderCard = (r: (typeof base)[number]) => {
                const m = cat.methods.find(x => x.id === r.methodId);
                const secs = r.fases.reduce((a, f) => a + f.duracionS, 0);
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
                    <div className="recipe-badge">
                      <span className="equip-icon equip-icon-sm" aria-hidden="true"><EquipmentIcon id={m?.icono ?? 'v60'} size={28} /></span>
                      <span>{m ? t(m.nombreKey) : r.methodId}</span>
                      {isCustom && <span className="pill">{t('recipes.customBadge')}</span>}
                    </div>
                    <h3>{name}</h3>
                    <p className="hero-meta">1:{r.ratio} · {r.cafeDefaultG}g · {r.fases.length} fases · ~{Math.max(1, Math.round(secs / 60))} min{(r.dificultad ? ` · ${r.dificultad}` : '')}</p>
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
              return <>{groups.map(g => (
                <div key={g.m.id} className="method-group">
                  <div className="method-group-head">
                    <span className="equip-icon equip-icon-sm" aria-hidden="true"><EquipmentIcon id={g.m.icono} size={28} /></span>
                    <h3>{t(g.m.nombreKey)}</h3>
                    <p className="hero-meta">{g.items.length}</p>
                  </div>
                  <div className="recipes-list">{g.items.map(renderCard)}</div>
                </div>
              ))}</>;
            })()}
            <RecipeCreateModal
              open={createOpen}
              methods={cat.methods}
              t={t}
              returnFocusRef={createBtnRef}
              onClose={() => setCreateOpen(false)}
              onSave={(input) => {
                try {
                  const lim = limitsFor(input.methodId);
                  const wmax = lim?.aguaMaxG ?? CONFIG.waterMaxG;
                  const cmax = lim?.tazasMax ?? CONFIG.cupsMax;
                  const waterNeed = input.coffeeDefaultG * input.ratio;
                  if ((lim?.cafeMaxG && input.coffeeDefaultG > lim.cafeMaxG) || waterNeed > wmax || waterNeed / CONFIG.gramsPerCup > cmax + 1e-9) {
                    const mName = t(cat.methods.find(m => m.id === input.methodId)?.nombreKey ?? input.methodId);
                    return t('method.limitHint').replace('{tazas}', String(cmax)).replace('{agua}', String(wmax)).replace('{metodo}', mName);
                  }
                  const created = createCustomRecipe(input);
                  const next = [...customs, created];
                  setCustoms(next);
                  saveCustomRecipes(next);
                  setRecipeId(created.id);
                  setMethodId(created.methodId);
                  setWaterG(Math.min(created.cafeDefaultG * created.ratio, wmax));
                  setRatio(created.ratio);
                  setOriginTab('recipes');
                  setStep('summary');
                  setTab('brew');
                  return null;
                } catch {
                  return t('error.coffee-range');
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
            <div className="setting-row"><span className="setting-label">{t('settings.advanced')}<small>{t('settings.advancedDesc')}</small></span><Toggle checked={advanced} onChange={setAdvanced} label={t('settings.advanced')} onText="On" offText="Off" /></div>
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
              <p>{t('settings.session')} {session ? `${session.displayName} (${session.email})` : t('settings.guest')}</p>
              {!session ? providers.map(p => <button type="button" className="btn-secondary" key={p} onClick={() => startLogin(p)}>Login {p}</button>) : <button type="button" className="btn-secondary" onClick={() => logout().then(() => setSession(null))}>Logout</button>}
              {authErr && <p>{t('settings.authError')}</p>}
              {providers.length === 0 && !session && <p className="next">{t('settings.noProviders')}</p>}
            </div>
          </section>
        )}
        <DiscoveryModal
          recipe={discoveryOpen ? surprise : null}
          methodName={surprise ? t(cat.methods.find(m => m.id === surprise.methodId)?.nombreKey ?? surprise.methodId) : ''}
          methodIcon={cat.methods.find(m => m.id === surprise?.methodId)?.icono ?? 'v60'}
          onClose={() => setDiscoveryOpen(false)}
          onBrew={() => { if (surprise) { setDiscoveryOpen(false); brewRecipe(surprise, 'home'); } }}
          onReroll={() => setSurpriseId(id => pickSurprise(id))}
          t={t}
        />
      </div>
    </div>
  );
}
