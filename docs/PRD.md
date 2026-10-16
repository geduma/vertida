# PRD — Vertida · coffee recipes and timer

- **Product:** Vertida · coffee recipes and timer. 100% client-side web (Vite + React TS + IndexedDB + PWA). Bilingual `es/en`, gram unit.
- **Status:** v2.0.0 MVP + iterations 002–013 (see `CHANGELOG.md`). `appId` placeholder, Law 1581 notice pending with lawyer.
- **Default locale:** `es`. Copy in `src/i18n/es.json` / `en.json`. Code and comments in English.

## 1. Vision and users

**Vision:** brew specialty coffee at home without friction: choose method → dose by water → follow the phase timer → repeat.

**Users:** (a) home brewer with V60/Chemex/Aeropress/Press who wants a guided recipe; (b) curious user discovering atypical recipes; (c) advanced user creating homemade recipes and marking favorites. Primary use mobile in the kitchen; desktop as support.

## 2. Scope (what the product does today)

1. **Home (dashboard):** random suggested recipe favoring favorites (visible favorites pool, visible fallback), selected methods with caps, stats (recipes / methods n/total / max cups), CTAs to Recipes and Discover.
2. **Prepare (brew, 4 screens):** `resumen (hero + controles)` → `vista previa (lista de fases)` → `en curso (anillo + 64pt + puntos de fase + pausa CTA + 2×2 Saltar/Silenciar/Reiniciar/Cancelar)` → `listo`. `back-link` (‹ + destination) always visible; island hidden in `running`.
3. **Water-only calculator:** water (g) + ratio inputs; coffee always derived (`agua / ratio`); `1 taza = 210 g`; clamp to method limits; out-of-range ratio warning; retention (`café × 2 g/g`) reference-only after Advanced toggle.
4. **Classic recipes (4):** `v60-clasica, chemex-clasica, aeropress-clasica, prensa-clasica`. Grouped by method (order + header with count), sorted by name per language. `Todas|Favoritas` filter with its own empty state. Selectable card (tap/Enter/Space → prepare); favorite with heart (`aria-pressed`, persists `localStorage`).
5. **Discover (3 atypical):** `v60-tonica, aeropress-invertido-frio, chemex-cascara`. No own tab: random modal from Home (`Cerrar/Otra/Preparar`, re-roll without repeating, ESC/backdrop, stable focus).
6. **Create homemade recipe:** `+ Nueva receta` button in Recipes → modal (method, name, ratio, base coffee, notes) → validates against method caps → saves to `localStorage` (without touching `data/`), brewable and deletable (v1: simple deletion).
7. **Methods and equipment (4):** `v60, chemex, aeropress, prensa-francesa` with limits (`v60 4tz/1000g/60g · chemex 6/1500/90 · aeropress 1/250/22 · prensa 4/1000/60`) and suggested grind. Settings chooses equipment (2-col modal with SVG per method); Home and Recipes only show selected; empty state with CTA to Settings.
8. **Settings:** language `ES/EN`, theme `Light/Dark/Auto` (follows OS live, persists), Advanced (`role=switch`), equipment, session (guest or `name (email)`, `Login <provider>` / `Logout`, visible errors).
9. **Timer:** per phase (`duracionS`, `aguaAcumuladaG`, `tipo manual/auto`), pause/resume, skip, mute, restart/cancel, `done` state → `listo` CTA. Background + WakeLock (per platform).
10. **PWA + offline data:** `VitePWA autoUpdate`, manifest `Vertida / #3b2316 / icon-192.png`, `CacheFirst` only for `/src/data/`. Optional local Google-only session via Geduma Auth (`apiBaseUrl https://api.geduma.com`, `redirect https://vertida.geduma.com/auth/callback`, 30 days, fail-closed).
11. **i18n + accessibility:** `t(k)` with `es → key` fallback; `tablist/radiogroup/switch/button` with `aria-selected/checked/pressed`; keyboard navigation in cards and modals; layout with no scroll-x <360px; desktop `≥1024px` with sidebar.

## 3. Non-goals

- No own backend, no cloud sync, no accounts beyond optional Google, no store or payments.
- No recipe import/export, no social, no analytics with identifiers (to be defined).
- No multi-unit support (grams only) nor multi-recipe parallel timer.

## 4. Non-functional requirements

| Area | Requirement |
|---|---|
| Client | 100% client-side; clean `tsc -b && vite build` build; `dist/ ~238KB JS` (reference 013) |
| Data | Versioned contract (`manifest.version 1`); `validate:data` OK 7; immutable field names |
| Quality | Green `vitest` (reference 47/47 in 013); every new behavior with test |
| Design | Mobile-first HIG: slate tokens (`src/theme/tokens.ts`), Liquid Glass island (single layer, no scrim), floating sidebar on desktop |
| A11y | Roles and focus per §2.11; light/dark contrast; persisted `data-theme` |
| Security | No `innerHTML`, no secrets, https-only, validated inputs (zod); deferred `npm audit fix --force` (breaks with Vite 8) |
| Privacy | Local-only triple `email/display/provider` 30d; no `rawData/salt`; Colombia Law 1581 notice **pending** |

## 5. Data and business rules

- Official = `1 JSON en src/data/recipes/ + 1 línea en manifest.json + claves en es/en.json` → `validate:data`.
- Homemade = `localStorage` (`lib/customRecipes.ts`), with template phases; favorites separate (`lib/favorites.ts`); equipment in IndexedDB (`lib/db.ts` store `equipment`).
- Dose: `coffee = water / ratio`; `water ≤ aguaMaxG`, `coffee ≤ cafeMaxG`, `water/210 ≤ tazasMax`; if `min===max` the input is disabled (aeropress 1-cup case).
- Methods ordered by `orden` (1 v60, 2 chemex, 3 aeropress, 4 press).

## 6. Known gaps and risks

1. `appId app_000000000000` placeholder — missing Geduma Auth onboarding.
2. Final 192/512 PWA icons pending (only `icon-192.png` referenced).
3. Law 1581 privacy notice pending with lawyer — do not claim compliance.
4. Real-brew validation pending (times/flavors per method).
5. Deferred `npm audit fix --force` due to Vite 8 breaking change.

## 7. Acceptance criteria (for any delivery)

- `npm run validate:data` OK + green `npm test` + clean `npm run build`.
- No hardcoded copy (everything via `i18n`), no data field renames, no island/sidebar/timer regression.
- Updated CHANGELOG (`Added/Changed/Fixed/Verified`) with the `Verified:` line actually executed.

## 8. Suggested roadmap (not committed)

- Close §6 gaps → homemade recipe export/import → local brew history → barista mode (phase editing in UI) → anonymous opt-in analytics.
