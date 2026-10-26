# PRD — Vertida · coffee recipes and timer

- **Product:** Vertida · coffee recipes and timer. 100% client-side web app (Vite + React TS + IndexedDB + PWA).
- **Status:** v2.0.0 with the 002–029 iteration set (see `CHANGELOG.md`). Local-only; no auth. Colombian Law 1581 notice still pending legal review.
- **Locales:** Spanish (default) and English. All UI copy lives in `src/i18n/es.json` / `en.json`; code and comments are in English.
- **Unit:** grams only.

## 1. Vision and users

**Vision:** brew specialty coffee at home without friction — choose a method, set the cups, follow the phases, repeat.

**Users:**

1. Home brewer with V60, Chemex, AeroPress, French press, Kalita, siphon, Clever, espresso or moka who wants a guided recipe.
2. Curious user looking for atypical brews through a low-commitment “discover” modal.
3. Advanced user who saves homemade recipes, favorites, equipment and preferences on the device.

Primary context is mobile in the kitchen; desktop is a supported second layout.

## 2. Scope (what the product does today)

### 2.1 Landing and shell

- Welcome screen with brand, title, subtitle and CTA; the CTA reveals the app.
- Three tabs — **Home · Recipes · Settings** — with `role=tablist`. Brewing is a destination reached from a recipe, not a tab.
- Floating glass tab bar on mobile; floating sidebar in the desktop grid (`≥1024px`).
- Mobile-first; reduced-motion and forced-colors styles included. Below 360 px, form actions scroll horizontally on purpose.

### 2.2 Home

- Suggested recipe (favoring favorites when present), method chips with limits, stats (recipes / selected methods / max cups), and CTAs to Recipes and Discover.
- Discovery opens a modal with an atypical recipe for the selected equipment: close, shuffle (no immediate repeat) and prepare; Escape and backdrop close it; focus is stable.

### 2.3 Brew flow (4 screens)

`summary → preview → running → done`

- **Summary:** recipe hero, cups slider, ratio stepper, derived coffee, method limit hint, optional retention reference behind Advanced.
- **Preview:** every phase with scaled water and duration; back and start.
- **Running:** progress ring, large water target, phase dots, current instruction and `phase i/n`, pause/resume, skip, mute, reset and cancel. The tab bar is hidden while running.
- **Done:** completion state with repeat/back actions.
- Timer is per recipe and phase (`durationS`); it resets when the recipe changes. WakeLock and background timing are used where the platform allows.

### 2.4 Dosing calculator

- Water is the primary input; **coffee is always derived** as `water / ratio`.
- Cups slider: 1…`cupsMax` (disabled when the method has a single cup). One cup is `min(recipe reference water, waterMaxG ÷ cupsMax)`.
- Ratio stepper: 0.5 steps clamped to the method's `ratioMin`/`ratioMax`; a warning appears only when the ratio is outside the active method band.
- Dose, water and ratio are clamped to method limits; when a method defines none, cups/water fall back to `CONFIG` and the ratio to 1–50.
- Advanced mode reveals approximate retention (`dose × 2 g/g`) as a reference value only.

### 2.5 Recipes

- **40 classic recipes** across 9 methods, grouped by method order and sorted by localized display name.
- `All | Favorites` segmented filter with its own empty state; heart toggles are `aria-pressed` and persisted.
- Cards are keyboard-operable (`Enter`/`Space`) and open the brew summary.
- `+ New recipe` creates a homemade recipe (method, name, ratio, dose, notes) with five template phases; it is brewable and deletable and never touches the bundled data.

### 2.6 Discover

- **18 atypical recipes** for the selected equipment. No Discover tab; the modal is launched from Home.
- Each atypical recipe carries a `storyKey`; the modal shows name, method, ratio/dose/phases/time and the story.

### 2.7 Methods and equipment

Nine methods: `v60, chemex, aeropress, french-press, kalita-wave, siphon, clever-dripper, espresso, moka`.

- Each method defines limits (cups, water, optional dose and ratio band), suggested grind and an SVG icon.
- Settings opens an equipment modal (checkbox cards, footer count + Save). Selection is persisted atomically in IndexedDB and filters Home and Recipes.
- Deselecting everything is valid and shows the empty states with a shortcut back to equipment.

### 2.8 Settings

- Language `ES | EN` (segmented radio).
- Theme `Light | Dark | Auto`, applied instantly, following the OS live in Auto.
- Advanced `On | Off` (retention reference).
- Equipment modal with counter.
- Version row (`v{__APP_VERSION__}` from `package.json`), manual update check with feedback, local-only notice and credits link.

### 2.9 Persistence

- `localStorage`: language, theme mode, advanced, mute, favorites and homemade recipes. All access is guarded against blocked/quota storage.
- IndexedDB `vertida` v1: `equipment` + `settings` stores for the equipment selection (atomic save, empty selection supported); `recipes` store reserved. `navigator.storage.persist()` is requested on startup.
- Pre-v2 custom recipes migrate from Spanish field names on read; legacy method ids are mapped rather than discarded.

### 2.10 PWA, updates and offline

- Installable manifest (`Vertida`, theme `#141414`, 192/512 any + maskable icons), precached shell and offline use.
- `autoUpdate` service-worker registration plus a manual **Check for updates** action with `idle | checking | uptodate | failed | unavailable` states; when nothing new is found it shows an “up to date” confirmation modal.
- Workbox runtime caching is scoped to `/src/data/` only.

### 2.11 i18n and accessibility

- `t(key)` with Spanish fallback to the key; dictionaries must have identical keys and placeholders (tested).
- All UI copy goes through i18n; data display keys are validated by tests.
- Semantic tablist, radiogroups, dialogs, checkboxes and buttons; focus management in modals; visible focus; no `innerHTML`.

## 3. Non-goals

- No backend, cloud sync, accounts, social features, store or payments.
- No recipe import/export in the UI, no brew history and no parallel multi-recipe timers.
- No units other than grams; no user-editable phase editor yet.
- No analytics with identifiers.
- No claim of legal/privacy compliance until the pending notice is reviewed.

## 4. Data and persistence contract

- **Aggregated, versioned data:** `src/data/methods.json`, `recipes.json` and `discovery.json`, each `{ version: 1, … }`. There is no manifest or per-recipe file.
- **Method fields:** `id, nameKey, descriptionKey, icon, grindKey, order, limits?, parameters?`.
- **Recipe fields:** `id, methodId, category, nameKey, ratio, coffeeDefaultG, origin, difficulty?, tags?, storyKey?, phases[], version`.
- **Phase fields:** `type, waterAccumulatedG, durationS, instructionKey`; the last phase must be `done` with `durationS: 0`; atypical recipes require `storyKey`.
- Field names are versioned: **never rename them**.
- Data is parsed with Zod in `src/lib/loadData.ts`; a schema break must fail tests.
- `difficulty` values are `easy | medium | advanced` and are translated in the UI; `tags` and `origin` are shown as raw data strings (known gap).

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Client | 100% client-side; clean `tsc -b && vite build` |
| Build size | 300.94 kB JS (80.86 kB gzip), 23.16 kB CSS, 16 precache entries |
| Data | Aggregated versioned JSON; Zod-validated; immutable field names |
| Quality | `npm test` green (15 files / 142 tests); every behavior change has a test |
| Design | Mobile-first HIG-style tokens in `src/theme/app.css`; light/dark/auto; glass tab bar; desktop sidebar |
| Scrolling | Page never scrolls; only `.list-scroll` / `.home-scroll` / `.brew-scroll` regions scroll |
| A11y | Semantic roles, keyboard operation, focus management, contrast, reduced motion, forced colors |
| Security | No `innerHTML`, no secrets, https-only links, Zod validation, React escaping |
| Privacy | Local-only; no accounts/session/network; Law 1581 notice pending |
| PWA | Installable, precached shell, manual update flow; runtime cache limited to `/src/data/` |

## 6. Known gaps and risks

1. **Law 1581 privacy notice** pending legal review — do not claim compliance.
2. **Tags/origin are untranslated** raw data strings; they currently read as English in the Spanish UI.
3. **Real-brew validation** of times, ratios and flavors per method is still pending; the catalog is curated but not lab-verified.
4. **Catalog rename impact:** favorites saved against pre-v2 recipe ids no longer match (the ids changed); equipment and custom-recipe method ids are migrated.
5. **`npm audit fix --force` postponed** because it pulls a breaking Vite major.
6. **IndexedDB `recipes` store reserved** but unused (custom recipes live in `localStorage`).
7. No automated screenshot/visual regression suite; layout is covered by DOM/CSS contract tests.

## 7. Acceptance criteria (any delivery)

- `npm test` green and `npm run build` clean.
- No hardcoded UI copy: new strings go to both dictionaries.
- No data-field renames; no regression in scroll containment, timer flow, equipment filtering or theme.
- CHANGELOG entry with `Added/Changed/Fixed/Verified`, and the `Verified:` line actually executed.
- Intentional test updates documented in the CHANGELOG.

## 8. Suggested roadmap (not committed)

Close the legal and validation gaps → homemade recipe export/import → local brew history → phase editing (“barista mode”) → optional anonymous, opt-in analytics.
