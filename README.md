<p align="center">
  <img src="public/logo.svg" alt="Vertida — logo" width="96" />
</p>

# Vertida · coffee recipes and timer

Vertida helps you brew specialty coffee at home without friction: pick a method, choose your cups, and follow a phase-by-phase timer until you serve.

100% client-side PWA. No account, no backend, no cloud sync — everything stays on your device.

## Current catalog

| | |
|---|---|
| Methods | **9** — V60, Chemex, AeroPress, French Press, Kalita Wave, Siphon, Clever Dripper, Espresso, Moka |
| Classic recipes | **40** (3–6 per method) |
| Discovery recipes | **18** atypical brews, one modal pick at a time |
| Languages | Spanish (default) and English, dictionary parity enforced by tests |

## What you can do

- **Landing → app shell.** A welcome screen introduces Vertida; the CTA reveals the three-tab app: Home, Recipes, Settings. Brewing is a destination, not a tab.
- **Brew with a guided timer.** Pick a recipe, adjust cups with a slider and the ratio with `−`/`+`, then follow summary → phase preview → running timer (progress ring, phase dots, pause/resume, skip, mute, reset, cancel) → done.
- **Water-first dosing.** Coffee is always derived from water and ratio (`coffee = water / ratio`). One cup is the method's own cup (`waterMaxG ÷ cupsMax`, capped at the recipe's reference water); dose and ratio are clamped to method limits.
- **Advanced retention reference.** Optional row showing approximate retained coffee (`dose × 2 g/g`); reference only.
- **Recipes.** Grouped by method, sorted per language, `All | Favorites`, heart toggles, and `+ New recipe` for homemade recipes saved on the device.
- **Discover.** A random atypical recipe in a modal with close / shuffle / prepare; Escape and backdrop close; shuffle avoids repeating.
- **Settings.** Language, theme (`Light | Dark | Auto`, follows the OS live), Advanced, equipment selection, version, manual update check, local-only notice and credits.
- **Install & offline.** PWA manifest with 192/512 icons (any + maskable), precached shell, and a manual “Check for updates” flow.
- **Accessible by default.** Real tablist/radiogroup/dialog semantics, keyboard-operable cards, visible focus, reduced-motion and forced-colors support.
- **Scoped scrolling.** The page itself never scrolls; list regions scroll instead, so heroes, headers and the floating tab bar stay in place.

## Stack

- Vite 5 + React 18 + TypeScript 5
- Zod for the data contract, `idb` for the IndexedDB seam
- `vite-plugin-pwa` (Workbox) for the service worker and manifest
- Vitest + Testing Library + happy-dom
- Plain CSS with design tokens (`src/theme/app.css`); no UI framework

## Quickstart

Requires Node 22+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest run
npm run build      # tsc -b && vite build
npm run preview    # serve the production build
```

The repository intentionally has only these four scripts. There is no separate data validator or icon generator command.

## Project structure

```
src/
  App.tsx                 # screens, brew flow, navigation, settings
  config.ts               # global limits, cup size, default equipment, credit URL
  main.tsx
  components/             # Landing, EquipmentModal, EquipmentIcon, RecipeCreateModal,
                          # DiscoveryModal, UpdateDoneModal
  lib/
    calc.ts               # derive coffee/water, cup size, ratio warning, validation
    db.ts                 # IndexedDB (equipment + settings stores, persist request)
    prefs.ts              # safe localStorage for language/theme/advanced/mute
    customRecipes.ts      # homemade recipes + legacy contract migration
    favorites.ts          # favorite ids
    legacyIds.ts          # pre-v2 method-id mapping
    loadData.ts           # zod-parse the three data files
    schemas.ts            # methods/phases/recipes contract
    useTimer.ts           # phase timer hook
    useAppUpdate.ts       # manual PWA update flow
  data/
    methods.json          # 9 methods, zod-validated
    recipes.json          # 40 classic recipes
    discovery.json        # 18 atypical recipes
  i18n/es.json, en.json   # all UI copy (parity enforced)
  theme/app.css           # tokens, light/dark, mobile + desktop layout
tests/                    # 15 files, 142 tests
```

## Data contract

All three data files are aggregated and versioned (`{ "version": 1, "methods": [...] }` or `"recipes": [...]`). There are no per-recipe files or manifest.

- **Method:** `id, nameKey, descriptionKey, icon, grindKey, order, limits?{cupsMax, waterMaxG, coffeeMaxG?, ratioMin?, ratioMax?}, parameters?{temperatureC?, totalTimeS?}`
- **Recipe:** `id, methodId, category( classic | atypical ), nameKey, ratio, coffeeDefaultG, origin, difficulty?, tags?, storyKey? (required for atypical), phases[], version`
- **Phase:** `type( bloom | pour | wait | stir | manual | done ), waterAccumulatedG, durationS, instructionKey`

Field names are a versioned contract: never rename them. All display copy lives behind `*Key` fields resolved through `src/i18n/*.json`.

Known gap: `tags` and `origin` are data-only free strings shown as-is (currently English in both languages), so they are not translated yet.

## Persistence

- **`localStorage`** — language, theme mode, advanced flag, mute, favorites and homemade recipes. Reads/writes are wrapped so blocked storage never breaks the app.
- **IndexedDB `vertida` v1** — `equipment` and `settings` stores back the equipment selection (atomic save, empty selection supported); the `recipes` store is reserved. The app asks for `navigator.storage.persist()` on startup.
- **Migration** — recipes saved with the pre-v2 Spanish field names are normalized on read; legacy method ids (`prensa-francesa`) are mapped to the current ids instead of being dropped.
- **No network** — no auth, analytics, session or remote storage.

## Quality gates

Run before claiming done:

```bash
npm test && npm run build
```

Verified for this revision:

- `npm test` — **15 files, 142 tests, all passing**
- `npm run build` — TypeScript clean; Vite build **300.94 kB JS (80.86 kB gzip)**, **23.16 kB CSS**, 16 precache entries

## Deploy

Push to `main`; `.github/workflows/azure-static-web-apps-ashy-desert-012092510.yml` builds the Vite app and publishes `dist/` to Azure Static Web Apps.

## Documentation

- Product scope and gaps: [`docs/PRD.md`](docs/PRD.md)
- Operational guide for agents: [`docs/AGENTS.md`](docs/AGENTS.md)
- History: [`CHANGELOG.md`](CHANGELOG.md)
- Local feature notes (gitignored): `docs/features/001-pwa-update-ux/`

## Privacy

Vertida runs entirely on your device. Recipes, favorites, equipment and preferences are stored locally; there is no account, no session and no server. The Colombian privacy notice (Law 1581) is still pending legal review — do not claim compliance.
