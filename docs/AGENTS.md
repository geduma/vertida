# AGENTS.md — Vertida

> Operational guide for AI agents working in this repo. Product truth lives in `docs/PRD.md`; stack truth lives in `package.json`, `src/config.ts` and the data files. Never invent product names, copy, recipes, limits or decisions — verify in the tree or ask.

## 1. What this repo is

- **Vertida · coffee recipes and timer.** 100% client-side web app: Vite 5 + React 18 + TypeScript 5 + IndexedDB + PWA.
- Private package `vertida@2.0.0`, `"type": "module"`.
- Bilingual `es` (default) / `en`, grams only. All UI copy is in `src/i18n/es.json` and `en.json`.
- **No auth, no backend, no network calls.** No `apiBaseUrl`, `appId`, session or cloud sync. Everything is local to the device.
- Privacy: local storage only. The Colombian Law 1581 notice is **pending legal review** — do not claim compliance.
- Config (`src/config.ts`): `appName Vertida`, `locales [es,en]`, `defaultLocale es`, `unit g`, `ratioMin 10`, `ratioMax 20`, `ratioDefault 16`, `coffeeMaxG 500`, `waterMaxG 5000`, `cupsMax 10`, `gramsPerCup 210`, `coffeeDefaultG 15`, `retentionGramsPerGram 2`, `creditUrl https://geduma.com`, and the default `equipment` list (must mirror `methods.json` ids in `order`).

## 2. Quickstart

Verified with Node 22.

```bash
npm install
npm test               # vitest run — 15 files / 142 tests
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build
npm run preview        # serve dist/
```

Scripts are exactly: `dev`, `build`, `preview`, `test`. There is **no** `validate:data` or `gen:icons` script, and no `manifest.json` / per-recipe files.

## 3. Repo map

```
src/
  App.tsx                 # screens, brew flow (summary→preview→running→done), navigation, settings
  config.ts               # global limits + defaults + credit URL
  main.tsx
  components/
    Landing.tsx           # welcome screen before the app shell
    EquipmentModal.tsx    # equipment checkboxes + footer count/Save
    EquipmentIcon.tsx     # SVG per method; SUPPORTED_ICON_IDS is the icon contract
    RecipeCreateModal.tsx # homemade recipe form
    DiscoveryModal.tsx    # atypical recipe modal (close/shuffle/prepare)
    UpdateDoneModal.tsx   # “up to date” confirmation
  lib/
    calc.ts               # calcWater/calcCoffee, methodCupG, cupSizeG, isRatioWarn, validate*
    schemas.ts            # Zod: PhaseType, PhaseSchema, MethodSchema, RecipeSchema
    loadData.ts           # parses the three data files with Zod
    db.ts                 # IndexedDB `vertida` v1: equipment + settings stores, persistStorage
    prefs.ts              # guarded localStorage helpers (lang/theme/advanced/mute)
    customRecipes.ts      # homemade recipes + legacy Spanish-field migration
    favorites.ts          # favorites in localStorage
    legacyIds.ts          # pre-v2 method-id mapping (prensa-francesa → french-press)
    useTimer.ts           # phase timer hook (rAF grid, background/WakeLock aware)
    useAppUpdate.ts       # manual PWA update flow
  data/
    methods.json          # 9 methods, versioned aggregate
    recipes.json          # 40 classic recipes
    discovery.json        # 18 atypical recipes (each with storyKey)
  i18n/es.json, en.json   # identical key sets; placeholders must match
  theme/app.css           # tokens, light/dark/auto, mobile + desktop, scroll containers
tests/                    # 15 files / 142 tests
docs/features/001-pwa-update-ux/  # update-flow spec/plan/tasks (gitignored features dir)
.github/workflows/azure-static-web-apps-ashy-desert-012092510.yml
```

## 4. Data contract

Three aggregated, versioned files: `{ "version": 1, "methods": [...] }` and `{ "version": 1, "recipes": [...] }`. Zod parses them in `src/lib/loadData.ts`; a schema break must fail `npm test`.

- **Method:** `id, nameKey, descriptionKey, icon, grindKey, order, limits?{cupsMax, waterMaxG, coffeeMaxG?, ratioMin?, ratioMax?}, parameters?{temperatureC?, totalTimeS?}`
- **Recipe:** `id, methodId, category( classic | atypical ), nameKey, ratio, coffeeDefaultG, origin, difficulty?, tags?, storyKey?, phases[], version`
  - `difficulty` values: `easy | medium | advanced` (translated by `difficultyLabel`).
  - `tags` and `origin` are raw data strings, currently shown untranslated.
- **Phase:** `type( bloom | pour | wait | stir | manual | done ), waterAccumulatedG, durationS, instructionKey`
  - Water must be non-decreasing; the last phase is `done` with `durationS: 0`.
  - Every `instructionKey`, `nameKey`, `descriptionKey` and `storyKey` must exist in **both** dictionaries.
- **Never rename data fields.** They are a versioned contract. If method ids change, add a migration in `src/lib/legacyIds.ts` (used by equipment hydration and custom recipes).
- Current methods (in `order`): `v60, chemex, aeropress, french-press, kalita-wave, siphon, clever-dripper, espresso, moka`.

## 5. Non-negotiable conventions

1. **Code and comments in English. UI copy via `src/i18n/*.json`.** Never hardcode Spanish/English in `.tsx`; add keys to both dictionaries. Tests use `tEs(key)`, not literals.
2. **Water-first dosing.** Coffee is derived (`water / ratio`). One cup is `cupSizeG(recipeBase, limits) = min(recipe base water, waterMaxG ÷ cupsMax)`. Clamp dose/water/ratio to the active method limits, with `CONFIG` fallbacks. `cupsMax === 1` disables the slider.
3. **Brew flow is 4 screens:** summary → preview → running → done. The tab bar is hidden while running. Timer resets per recipe; guard phase indexes. Retention is reference-only behind Advanced.
4. **Navigation:** tabs `Home | Recipes | Settings` (`role=tablist`). Brew is a destination. No Discover tab — discovery is a modal from Home. Back links return to the origin tab.
5. **Recipes:** grouped by method order, sorted by localized display name; `All | Favorites`; card is a keyboard-operable `role=button`; delete/favorite buttons stop propagation. Homemade recipes live only in `localStorage`.
6. **Theme:** `PREF_KEYS.themeMode` (`light|dark|auto`) plus legacy `vertida-theme`; apply via `document.documentElement.dataset.theme`; Auto follows `matchMedia` live. Mobile: floating glass pill; desktop (`≥1024px`): floating sidebar grid.
7. **Settings:** language and theme are segmented radiogroups; Advanced is `On | Off` segmented; equipment is a modal with footer count + Save; version comes from `__APP_VERSION__` (`package.json`); update row is wired to `useAppUpdate`; credits link uses `CONFIG.creditUrl`.
8. **Persistence:** `localStorage` for language/theme/advanced/mute/favorites/custom recipes; IndexedDB `vertida` v1 (`equipment` + `settings`) for equipment. Hydrate equipment **before** persisting; `loadEquipmentIds()` returning `null` means “keep defaults”, `[]` means “nothing selected”. All storage access is guarded.
9. **Scrolling is scoped.** The page never scrolls: `html,body{height:100%;overflow:hidden}` and `.app` is viewport-bounded. Only `.list-scroll`, `.home-scroll` and `.brew-scroll` scroll. Any new overflowing list must use one of these containers.
10. **Security:** no `innerHTML`/`dangerouslySetInnerHTML`/`document.write`, no secrets, https-only links, Zod validation, React escaping. `npm audit fix --force` is postponed (breaking Vite major) — do not run it unasked.
11. **Docs live with code.** CHANGELOG entries are latest-first and grouped `Added/Changed/Fixed/Verified`; the `Verified:` line must be actually run.

## 6. Common tasks

**Add a classic recipe**

1. Append a recipe object to `src/data/recipes.json` (`category: "classic"`, valid phases, existing `methodId`).
2. Add `recipe.<id>.name` to both `src/i18n/es.json` and `en.json`.
3. Run `npm test && npm run build`.

**Add a discovery recipe**

1. Append to `src/data/discovery.json` with `category: "atypical"` and a `storyKey`.
2. Add `recipe.<id>.name` and `recipe.<id>.story` to both dictionaries.
3. Run the gates.

**Add or rename a method**

1. Edit `src/data/methods.json` (keep `order` sequential).
2. Add `method.<id>.name` / `.desc` and the `grind.*` key to both dictionaries.
3. Add the icon id to `SUPPORTED_ICON_IDS` and draw it in `EquipmentIcon` (or reuse an existing shape intentionally).
4. Mirror the id in `CONFIG.equipment` in the same order.
5. Add a legacy mapping in `src/lib/legacyIds.ts` if an old id was stored on devices.
6. Run the gates; `tests/catalog.test.ts` enforces order, icons and limits.

**Homemade recipe**

UI-only: `RecipeCreateModal` → `createCustomRecipe()` → `localStorage`. Never touch `src/data/`. Template phases come from `buildDefaultPhases()`; legacy Spanish-field/`prensa-francesa` records are normalized on read.

**Calculator / limits**

`waterGN = clamp(cups × cupG, 1, waterMaxG)`; `ratioN = clamp(ratio, ratioMin, ratioMax)`; `coffeeEff = calcCoffee(water, ratio)`; warn with `isRatioWarn(ratioN, ratioMin, ratioMax)`; hint with `method.limitHint {tazas} {agua} {metodo}`. Phase water is scaled by `waterGN / recipeBaseWater`.

**Settings / persistence**

Use `readPref`/`writePref`/`readFlag`/`writeFlag` from `src/lib/prefs.ts` (never raw `localStorage` for preferences). Equipment goes through `loadEquipmentIds`/`saveEquipmentIds` in `src/lib/db.ts`. Language switch must re-render the tab bar (`key={lang}`).

**Tests**

Add behavior tests under `tests/` using `tests/helpers.tsx` (`renderApp`, `tEs`, `dEn`, `flush`) and mock the DB seam (`loadEquipmentIds`, `saveEquipmentIds`, `persistStorage`). Derive expectations from data/i18n instead of hardcoding copy. Use fake timers for the timer. Intentional updates to existing tests must be explained in the CHANGELOG.

## 7. Quality gates

```bash
npm test && npm run build
```

- New behavior needs a test; every data/i18n key referenced by data must exist in both languages (`tests/i18n.test.ts`).
- `tests/catalog.test.ts` guards method order, icon support, limits and monotonic phase water.
- `tests/update-credits.test.tsx` guards the scoped-scroll contract.
- Do not expand Workbox runtime caching beyond `/src/data/` without a decision record.
- Wide doc rewrites need explicit user approval first.

## 8. Never do

- Rename data or IndexedDB fields; invent copy, methods, recipes or limits.
- Store anything beyond local device storage, or add network calls/auth.
- Claim Law 1581 compliance.
- Run `sec-audit`, `git commit`, `git push` or open a PR unless explicitly asked.
- Delete or rewrite another session’s uncommitted work without confirming it is stopped.

## References

- Product: `docs/PRD.md` · History: `CHANGELOG.md` · Entry: `README.md`
- Local (gitignored) feature notes: `docs/features/001-pwa-update-ux/`
