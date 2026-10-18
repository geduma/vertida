# AGENTS.md — Vertida

> Operational guide for AI agents working in this repo. Product truth lives in `docs/PRD.md`. Stack truth lives in `package.json` + `src/config.ts`. Never invent product names, copy, or decisions — ask or verify.

## 1. What this repo is

- **Vertida · coffee recipes and timer.** 100% client-side web: Vite + React 18 + TS + IndexedDB + PWA. Bilingual `es/en`, gram unit.
- Private package `vertida@2.0.0`, `"type": "module"`.
- Config: `src/config.ts` (`appName Vertida`, `locales [es,en]` default `es`, `unit g`, `gramsPerCup 210`, `coffeeDefaultG 15`, `retentionGramsPerGram 2`, `equipment [v60, chemex, aeropress, prensa-francesa]`). No auth keys (`apiBaseUrl`, `appId`, `redirectUrl`, `sessionMaxDays` removed).
- Auth: none. MVP is local-only; no login, no providers, no session.
- Privacy: only local `email/display/provider`, 30d. No `rawData`/`salt`. Colombian Law 1581 notice **pending with lawyer** — do not claim compliance.

## 2. Quickstart (verified with node 22.23.3)

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"
npm i
npm run validate:data  # OK 7 recipes (4 classic + 3 discovery, manifest version 1)
npm test               # see CHANGELOG latest: 47/47 at 013 (README 17/17 is stale)
npm run dev            # http://localhost:5173
npm run build          # dist/ ~238KB JS + tsc -b
```

Scripts: `dev: vite`, `build: tsc -b && vite build`, `preview: vite preview`, `validate:data: tsx scripts/validate-data.ts`, `test: vitest run`.

## 3. Repo map

```
src/
  App.tsx                 # tabs home/brew/recipes/settings; brew is a destination, not a tab (originTab pattern)
  config.ts               # global limits + defaults (see §1)
  main.tsx
  components/             # Toggle, EquipmentModal, EquipmentIcon, RecipeCreateModal, DiscoveryModal
  lib/                    # loadData, calc (calcCoffee/cupsToWater/isRatioWarn), useTimer, db (idb),
                          # customRecipes, favorites. No auth module (removed).
  data/                   # methods.json, recipes/*.json (4), discovery/*.json (3), manifest.json, version.json
  i18n/es.json, en.json   # ALL UI copy lives here, keyed (t(k) falls back es → key)
  theme/tokens.ts, app.css # premium slate tokens, light/dark via [data-theme], Liquid Glass island/sidebar
scripts/validate-data.ts  # zod validation of data/ contract
tests/                    # vitest: calc, settings, stable-005, centered-cards-006, stability-011, desktop-012, discover-013…
vite.config.ts            # VitePWA autoUpdate; manifest Vertida / #3b2316 / icon-192.png;
                          # workbox CacheFirst only for /src/data/
```

Data contract (`src/data/`):

- `methods.json` (4): `v60` (4 tazas / 1000g / 60g, `grind.media`), `chemex` (6 / 1500 / 90, `grind.media-gruesa`), `aeropress` (1 / 250 / 22, `grind.fina-media`), `prensa-francesa` (4 / 1000 / 60, `grind.gruesa`). Fields: `id, nombreKey, descripcionKey, icono, moliendaKey, orden, limites{tazasMax, aguaMaxG, cafeMaxG}`.
- `manifest.json`: `{ methods[4], recipes[4: v60-clasica, chemex-clasica, aeropress-clasica, prensa-clasica], discovery[3: v60-tonica, aeropress-invertido-frio, chemex-cascara], version: 1 }`.
- Recipe/discovery JSON: `id, methodId, ratio, cafeDefaultG, fases[{instruccionKey, aguaAcumuladaG, duracionS, tipo}]`, plus `dificultad/tags` optional. Field names are a **versioned contract — never rename**.

## 4. Non-negotiable conventions

1. **Code and comments in English. Copy via `src/i18n/*.json`. Data field names stay as-is.** Never hardcode UI Spanish/English in `.tsx`; add keys to both `es.json` + `en.json`.
2. **Dose is water-only.** Inputs `waterG: number|''` + `ratio: number|''`; coffee is always derived `calcCoffee(water, ratio)`. `1 taza = 210 g` (`CONFIG.gramsPerCup`). Empty input shows `''`, `onBlur` clamps; derived never 0. Clamp to **method limits** (`limites`), not global `CONFIG` alone; `min===max` → `disabled` input.
3. **Brew flow is 4 screens:** `summary (hero + controls)` → `preview (phase list)` → `running (ring + 64pt + phase dots + pause-CTA + 2×2 Skip/Mute/Reset/Cancel)` → `done`. Timer resets per recipe; guard `fases[idx]`. Retention display (`coffee * 2g/g`) is reference-only behind Advanced toggle.
4. **Navigation:** tabbar `Inicio|Recetas|Ajustes` (`role=tablist`, `key={lang}` so island re-renders on language switch). Brew hides island in `running`. `back-link` (`‹ + destino`) in summary + preview + running. No `Descubrir` tab — discovery is a random modal from home (`Cerrar/Otra/Preparar`, ESC/backdrop, stable focus, re-roll without repeating).
5. **Recipes list:** grouped by method (`orden` + header with count), sorted by display name per `lang`; `Todas|Favoritas` segmented (`role=radiogroup`); card is `role=button` (Enter/Space brews); custom `Delete` uses `stopPropagation`. Favorites in `localStorage` (`lib/favorites.ts`); customs in `localStorage` (`lib/customRecipes.ts`).
6. **Theme:** `vertida-theme-mode` `light|dark|auto` (+ legacy `vertida-theme`), `document.documentElement.dataset.theme`, follows OS live via `matchMedia`. Mobile: floating Liquid Glass pill (single glass layer, no scrim). Desktop `≥1024px`: floating sidebar (nav inside `.app` grid col 1, content col 2). Compact buttons (`--btn-radius 12px`, heights 52/48/40); modals have footer actions on one line (`.form-actions{nowrap}`); no `modal-close` X — footer `Save/Cancel` only.
7. **Security:** no `innerHTML`/`dangerouslySetInnerHTML`, no secrets in repo, https-only, validated inputs (zod), React escaping. `npm audit fix --force` is **postponed** (Vite 8 breaking) — do not run unasked.
8. **Docs live with code.** CHANGELOG entries are human-grouped (`Added/Changed/Fixed/Verified`), latest-first. One fact per bullet with file paths. `Verified:` line must be actually run (`build`, `test`, `validate:data`).

## 5. How to do common tasks

**Add an official recipe (data change):**

1. Add `src/data/recipes/<id>.json` (zod-valid phases, `methodId` must exist).
2. Append id to `manifest.json → recipes`.
3. Add display/instruction keys to **both** `src/i18n/es.json` and `en.json`.
4. Run `npm run validate:data` (must say OK 7+n) + `npm test` + `npm run build`.

**Custom (homemade) recipe:** UI-only via `+ New recipe` button → `RecipeCreateModal` → `createCustomRecipe()` → `localStorage`. Never touch `data/`. Enforce method caps (`cafeMaxG`, `aguaMaxG`, `tazasMax` via `gramsPerCup`) with `method.limitHint`; on zod failure return `error.coffee-range`.

**Calculator/limits:** `waterGN = clamp(waterG, 1, aguaMaxG)`, `ratioN = clamp(ratio, ratioMin, ratioMax)` from `method.limites` (fallback `1–50/16`); `coffeeEff = calcCoffee(water, ratio)`; warn via `isRatioWarn(ratioN)`; hint via `method.limitHint {tazas} {agua} {metodo}`.

**Settings:** language segmented `ES/EN` (`role=radio`, `aria-checked`); theme segmented `Light/Dark/Auto` + `Current: X` sub-label; Advanced `role=switch` Toggle; equipment via modal (footer counter + Save, min 2-col grid, per-method SVG); local-only notice row (no accounts, no session).

## 6. Quality gates (run before claiming done)

```bash
npm run validate:data && npm test && npm run build
```

- New behavior needs a test in `tests/` (follow `discover-013` / `desktop-012` pattern: `data-testid` + stable strings, intentional updates to old tests documented in CHANGELOG).
- PWA: do not expand `workbox.runtimeCaching` beyond `/src/data/` without a decision record.
- Wide doc rewrites (many files / published pages) need explicit user approval first.

## 7. Never do

- Rename data/DB fields; invent copy, methods, recipes, limits, or `appId`; claim Law 1581 compliance; add network calls outside `apiBaseUrl`; store anything beyond local device storage; add `sec-audit` or `commit/push/PR` unasked.

## References

- Product: `docs/PRD.md` · History: `CHANGELOG.md` · Entry: `README.md`
- Historical spec (not in tree): `docs/features/001-vertida-mvp/spec.md`
