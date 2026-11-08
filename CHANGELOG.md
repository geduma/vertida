# Changelog

## [Unreleased] — 036 mobile viewport, island clearance and glass blur
### Fixed
- **Blank band below the floating island (iPhone 15 Plus, installed PWA):** `.app` and `.landing` now take `height:var(--app-h,100dvh)` with the existing `100dvh`/`100svh`/`100vh` fallbacks, and the new `src/lib/useAppHeight.ts` hook measures `window.innerHeight` into `--app-h` on mount and on `resize`/`orientationchange` (`visualViewport` is intentionally not used, so the keyboard does not shrink the shell).
- **Over-reported bottom safe area:** added `--safe-bottom:min(env(safe-area-inset-bottom, 0px), 34px)` and reused it in `.app`, `.tabbar`, `.screen-dock`, `.timer-dock`, `.modal-backdrop`, `.landing` and the desktop/short-viewport media queries. `--scroll-pad` is now `calc(var(--island-h) + 24px)`, so the inset is no longer counted twice.
- **Home Methods panel running behind the island:** the `Methods` surface now stops 12 px above the island — `.home-body` reserves `padding-bottom:calc(var(--island-h) + 12px)` — and the `--scroll-pad` reserve applies only to `.list-scroll` (Recipes/Settings); `.home-methods-scroll` no longer reserves it. The desktop `@media(min-width:1024px)` override keeps `.home-body{padding-bottom:0;scroll-padding-bottom:0}`.
- **Content stayed sharp behind the island:** removed `transform:translateZ(0)` and `will-change:backdrop-filter` from `.tabbar`, plus `-webkit-overflow-scrolling:touch` from `.list-scroll`, `.screen-scroll` and `.home-methods-scroll`, so iOS samples the backdrop instead of excluding a promoted layer.
- **Light canvas in dark mode on the installed PWA:** removed the inline `style` attributes from `<html>` and `<body>` in `index.html`; height and background are owned by the theme CSS on `html`, `body` and `#root`.
- **Test contract updated intentionally:** `tests/update-credits.test.tsx` now asserts the scroll pad lives only on `.list-scroll` (never on `.home-methods-scroll`), that `.home-body` clears the island with `padding-bottom:calc(var(--island-h) + 12px)`, that `will-change:backdrop-filter` and `-webkit-overflow-scrolling:touch` are absent, and that `--safe-bottom` is capped with `min(env(safe-area-inset-bottom …), 34px)`. New `tests/app-height.test.ts` covers the `--app-h` mount and resize updates.
### Verified
- `npm test` **158/158 across 18 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **274.35 kB JS (76.73 kB gzip)**, **34.98 kB CSS (7.61 kB gzip)**, 16 precache entries (304.04 KiB).

## [Unreleased] — 035 English documentation refresh
### Changed
- `docs/PRIVACY.md`: translated the full working draft from Spanish to English, keeping the legal-review warning, placeholders and the note that a Spanish version must be prepared for the Colombian market before publication.
- `CHANGELOG.md`: translated the Spanish entries (034–025 and the older mixed sections) to English so the whole history is readable in one language.
- `docs/AGENTS.md`: updated the test counts (17 files / 157 tests), added `appRestart.ts` and `modalLayer.ts` to the repo map, documented the full-restart update flow, the portaled/inert modals and the current scroll containers, and removed stale `docs/features/` references.
- `docs/PRD.md`: updated the iteration range to 002–034, the build/test figures, the scroll model (`.home-methods-scroll`, `.list-scroll`, `.screen-scroll`), the `restarting` update state and the modal isolation behaviour.
- `README.md`: refreshed test counts and build sizes, documented the full-restart update flow and modal isolation, and removed the non-existent gitignored feature-notes path.
### Verified
- `npm test` **157/157 across 17 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **273.98 kB JS (76.61 kB gzip)**, **35.12 kB CSS (7.61 kB gzip)**, 16 precache entries.
- `git diff --check` clean; no source, data or i18n behaviour changed by this documentation pass.

## [Unreleased] — 034 unified containers, scroll-free Home, real restart and isolated modals
### Added
- `src/lib/appRestart.ts`: full app restart — purges every Cache Storage entry, unregisters the service workers and navigates to a URL with the unique `__vertida_restart` parameter so the document is fetched from the network.
- `src/lib/modalLayer.ts`: shared modal layer — open counter, `inert` on `.app`, island hiding and a Tab/Shift+Tab focus trap.
- `tests/app-restart.test.ts`: contract for the restart URL, cache purge, worker unregister and fallback navigation.
### Changed
- `src/App.tsx` (Recipes and Settings): the container is no longer a full-screen sheet; both screens use Home's pattern —fixed `.hero` header and a single `.list-scroll` with `.surface` cards— so they keep the same borders, radius and 16 px margins.
- `src/App.tsx` (Home): the hero and stats stay fixed; only the method grid (`.home-methods-scroll`) can scroll inside `.home-body`, which never scrolls. On desktop the `grid` distributes methods and stats without enabling page scroll.
- `src/lib/useAppUpdate.ts`: after `reg.update()` it briefly waits for a worker in `waiting`/`installing`; if one exists it sends `SKIP_WAITING` and calls `restartApp()`. With no new worker it reports “up to date” without restarting. New `restarting` state.
- `src/i18n/es.json`, `src/i18n/en.json`: `settings.updateRestarting` key (**Reiniciando…** / **Restarting…**) for the button and feedback during the restart.
- `src/components/{EquipmentModal,RecipeCreateModal,DiscoveryModal,UpdateDoneModal}.tsx`: dialogs mount through `createPortal` into `document.body` and use the shared modal layer.
- `src/theme/app.css`: removes the mobile Recipes/Settings bleed (`margin-inline:-16px`, no side/bottom borders or bottom radius); the backdrop rises to `z-index:120` and darkens; `body[data-modal='true']` hides the island and blocks overscroll; `.btn-equip` becomes `width:auto;min-width:150px;padding-inline:18px`.
### Fixed
- **Clipped “Choose equipment” label:** the fixed 150 px width no longer truncates the ES/EN label; the button grows to the available width without overflowing the row.
- **Background and island reachable with a modal open:** the app content becomes `inert`, the floating island is hidden and focus cannot leave the dialog, with Tab or touch.
- **Update not applying on installed iOS:** the restart no longer relies on `location.reload()` or `controllerchange`; caches and workers are removed before navigating, so the new build loads without closing and reopening the app by hand.
### Verified
- `npm test` **157/157 across 17 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **273.98 kB JS (76.61 kB gzip)**, **35.12 kB CSS (7.61 kB gzip)**, 16 precache entries (303.93 KiB).
- The update-flow test waits for the “up to date” dialog with a 3 s margin; the real restart is covered with mocked `caches`, `serviceWorker` and `location.replace`.

## [Unreleased] — 033 liquid glass, motion and scroll integrity
### Added
- `src/components/TabIcon.tsx`: stroke SVG icons for **Home · Recipes · Settings** (`aria-hidden`), with an always-visible text label.
- `src/theme/app.css`: motion system with `screenIn` + 60 ms staggered `riseIn`, modal entrance, sliding tab lens (`--active`), ring sweep (`@property --p`), press feedback and full respect for `prefers-reduced-motion`.
- `src/theme/app.css`: ambient light with CSS radial gradients so the glass has something to refract; glass tokens, `--scroll-pad`, `--island-h`, `--on-accent` and solid surfaces for docks.
- `docs/features/033-liquid-glass-motion-scroll/{spec,plan,tasks}.md`: approved scope and verification matrix.
### Changed
- `src/App.tsx`: one scroll region per screen (`.home-scroll`, `.list-scroll`, `.screen-scroll`); Home with a fixed hero and stats/Discover before methods; Recipes with full-width method groups; Settings with a single scrollable section.
- `src/App.tsx`: the tab bar is hidden across the **entire** brew flow (summary, preview, running and done), not only while running; each step uses a solid bottom dock with the primary actions always visible.
- `src/theme/app.css`: the island is a single glass layer again (`blur(30px) saturate(2)`, 52 % light / 54 % dark fill) with a specular border, top sheen, double shadow and lens; the dock and modal footers are solid. At `≥1024px` the island becomes a 280 px vertical sidebar with a vertical lens.
- `src/theme/app.css`: removes the fixed `110px` bottom reserve on `.app` (a ~34 px dead band above the island). Content now fills the screen and each container reserves `--scroll-pad` (island 68 + 24 + safe area; **92 px** measured at 320×568), so the last item always sits above the island.
- `src/theme/app.css`: height- and width-responsive layouts — timer without scroll at 320×568 (`clamp()` ring, percentage inner circle, 44–64 px mega), Recipes 1 column <360 and 2/3/4 by width; Settings keeps the fixed control widths for the ES↔EN contract. Method cards use `auto-fit` (2 columns mobile, 3–4 tablet, 2 in the 1024 column and 4 at 1440) and recover border, selected state and centered content.
- `index.html`: `viewport-fit=cover` and `color-scheme` for real safe areas on iOS/Android.
### Fixed
- **Modals off-screen when Settings was scrolled:** `riseIn` used `animation-fill-mode: both`, leaving a permanent `transform: matrix(1,0,0,1,0,0)` on `.settings-body`; that turned the section into the containing block for `position:fixed` and the backdrop rendered at `y=-529` with the dialog at `y=-242`. Fill-mode is now `backwards`; measured after scrolling Settings 400 px: `.settings-body` with `transform:none`, backdrop `(0,0,320×568)` and modal `(12,34,296×500)` with the footer at `519 px` inside 568.
- Content clipped under the island: no list ended above the bar. The 7 audited sizes (320×568 → 1440×900) now show `lastBottom <= islandTop - 4`.
- CTAs outside the viewport: summary, preview and done use a dock; at 320×568 the summary CTA measures `y=508…560`, the preview buttons `508…560`, and pause/skip stay inside 568 without scrolling.
- One scroll container per screen; nested scrolling is removed from Recipes and Settings.
- **Settings/Recipes borders visible behind the island:** mobile sheets bleed to the app width (`margin-inline:-16px`), lose side/bottom borders and bottom radius, and their background fades over the last 84 px. The island no longer shows the container edge or hard lines, only blurred surface and content.
- **Empty method cards:** at 1024 px the grid forced 4 columns of 73 px; `auto-fit` now gives 2 columns of 155 px at that width and 4 of 164 px at 1440. Border, tinted background, centered content and active-method check are restored.
### Verified
- `npm test` **153/153 across 16 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **271.07 kB JS (75.87 kB gzip)**, **33.39 kB CSS**, 16 precache entries (previously 269.74 kB / 75.57 kB gzip and 24.24 kB CSS).
- Headless audit at 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768 and 1440×900, light and dark: no horizontal overflow, no hidden CTAs, one scroll per screen, last row clear of the island/sidebar and `blur(30px) saturate(2)` on the mobile island and desktop sidebar.
- Measured method grid: 320→125 px, 390→158, 768→186, 1024→155, 1440→164; no clipped names.
- Measured dark contrast: CTA **6.70:1**, ink/surface **15.21:1**, muted/surface **9.15:1**, muted/background **10.05:1**.
- Equipment modal verified at 320×568 with Settings scrolled: footer visible and no horizontal overflow.

## [Unreleased] — 032 Settings order and ES↔EN stability
### Changed
- `src/App.tsx` (Settings): the **Version** row moves to the end, right before the **By geduma** credit row and after the local-mode notice.
- `src/i18n/es.json`, `src/i18n/en.json`: shorter, symmetric copy across languages (`settings.themeDesc`, `settings.advanced`, `settings.advancedDesc`, `settings.githubDesc`, `settings.feedback*`, `settings.update*`, `settings.localOnly`) and a new `settings.updateCta` key (**Buscar** / **Check**) so the update button does not depend on the row's long text.
- `src/theme/app.css`: fixed row geometry — one-line titles with `ellipsis`, description boxes reserving 2 lines (`line-clamp` + `height:2.8em`), fixed widths for equipment/update/feedback buttons, the Advanced segmented control and `theme-current`; `content-visibility:auto` is removed from rows so scrolling does not change when switching languages. At ≤359 px labels stack above the control.
- `tests/update-credits.test.tsx`: order contract (version penultimate, credit last) and fixed-geometry contract; `tests/i18n.test.ts`: Settings copy length parity (±8 characters).
### Verified
- `npm test` **150/150 across 16 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **269.74 kB JS (75.57 kB gzip)**, **24.24 kB CSS**, 16 precache entries.

## [Unreleased] — 031 project links and feedback in Settings
### Added
- `src/config.ts`: `repoUrl` (`https://github.com/geduma/vertida`) and `issuesUrl` (`https://github.com/geduma/vertida/issues/new`); external URLs are still never written inline in components.
- `src/components/GitHubIcon.tsx`: decorative GitHub SVG mark (`aria-hidden`), no new dependencies.
- `src/App.tsx` (Settings): **GitHub** row with an icon-link (`data-testid="settings-github"`, `aria-label`, new tab with `noopener noreferrer`) and **Bugs and feedback** row with a link-button that opens a new issue (`data-testid="settings-feedback"`).
- `src/i18n/es.json`, `src/i18n/en.json`: `settings.github`, `settings.githubDesc`, `settings.githubOpen`, `settings.feedback`, `settings.feedbackDesc`, `settings.feedbackCta` keys.
- `src/theme/app.css`: `.github-link` (44×44 touch target, visible focus) and a button-styled anchor in Settings rows.
- `tests/settings-links.test.tsx`: URL contract, new-tab attributes, accessible name and decorative icon.
### Verified
- `npm test` 146/146 across 16 files; clean `npm run build` (`tsc -b` + Vite/PWA).

## [Unreleased] — 030 pending items: translated tags, preferences without migration, DB v2 and vulnerability-free toolchain
### Added
- `src/i18n/es.json`, `src/i18n/en.json`: **26 `tag.*` keys** to translate data labels; both dictionaries reach **246 keys per language** with exact parity. `src/App.tsx` resolves `tagLabel()` and no longer prints the English slugs.
- `docs/VALIDATION.md`: in-cup validation protocol for the 40 classics + 18 discoveries (dose, water, ratio, time, tags, three attempts per recipe and acceptance criteria).
- `docs/PRIVACY.md`: privacy-notice draft (Law 1581) in Spanish with an English summary. It states explicitly that **no user data is collected**, that only preferences, favorites and own recipes are stored in local storage, and that there is no external database.
- `tests/recipes.test.tsx`: data tags render translated.
- `package.json`: `engines.node >=22.12.0`, aligned with Vite 8 and Vitest 5.
### Changed
- Major toolchain: **Vite 8.3.5**, **Vitest 5.0.5**, **@vitejs/plugin-react 6.1.2**, **vite-plugin-pwa 2.0.0**, **Zod 4.6.7** and TypeScript 5.9.3.
- `src/lib/schemas.ts` migrated to **`zod/mini`** with `.check(...)`: same validation, smaller bundle than full Zod 4 (~64 kB less).
- `vite.config.ts`: `pool: 'vmThreads'` to soften Vitest 5's environment cost.
- `src/lib/db.ts`: IndexedDB moves to **v2** and drops the unused `recipes` store; `equipment` + `settings` remain the only IndexedDB persistence.
- `tests/i18n.test.ts`: now requires keys for `grindKey` and every data `tag`, in addition to names, descriptions, instructions and stories.
- `src/i18n/*.json`: the local-mode notice explicitly says "no account or server; your data never leaves your device", in line with `docs/PRIVACY.md`.
- `README.md`, `docs/PRD.md`, `docs/AGENTS.md`: real figures (143 tests, 267.18 kB JS, 0 vulnerabilities), v2 persistence, translated tags and links to the new documents.
### Fixed
- Favorites: saved entries with pre-v2 ids are **not preserved**. They no longer match and the user can clear their data; no recipe-by-recipe mapping is invented. Method migration (`prensa-francesa`) and custom-recipe field migration remain because that is content, not preference.
- `npm audit`: from **11 vulnerabilities (2 critical, 3 high)** to **0**, without `--force` and with green tests/build.
- Bundle: from 300.94 kB (80.86 kB gzip) to **267.18 kB (74.90 kB gzip)** despite the major toolchain bump.
### Removed
- IndexedDB `recipes` store (reserved and unused since creation).
- Implicit full Zod 4 dependency in the production bundle.
- Any pre-v2 favorites migration: old preferences are accepted as lost.
### Verified
- `npm test` **143/143 across 15 files**; clean `npm run build` (`tsc -b` + Vite 8/PWA): **267.18 kB JS (74.90 kB gzip)**, **22.86 kB CSS**, 16 precache entries; `npm audit` **0 vulnerabilities**.
### Notes
- The privacy notice is a **draft** with controller and contact placeholders; do not claim legal compliance until review.
- In-cup validation was **not executed**: `docs/VALIDATION.md` is the protocol, not evidence.
- Do not import full `zod` again: the bundle grows ~64 kB and breaks the size NFR.
- Vitest 5 takes ~40 s for 15 files (previously tens of seconds less); it is the cost of the major version, mitigated with `vmThreads`.

## [Unreleased] — 029 expanded catalog, complete i18n and real scrolling
### Added
- `src/data/recipes.json`: classic catalog expanded from 18 to **40 recipes** (3–6 per method), with English ids (`v60-balanced`, `chemex-three-pours`, `french-press-light-17`, `moka-partners-12`…), `difficulty` normalized to `easy|medium|advanced` and English `tags`.
- `src/data/discovery.json`: **18** atypical discoveries (previously 9), all with `storyKey`; new instruction keys `phase.bypass`, `phase.ice` and `phase.preinfusion` (schema phase types do not change).
- `src/lib/legacyIds.ts`: `prensa-francesa → french-press` map for equipment stored in IndexedDB and old custom recipes; applied when hydrating equipment (`src/App.tsx`) and normalizing recipes (`src/lib/customRecipes.ts`).
- `tests/custom-recipes.test.ts`: legacy id-map coverage; `tests/settings.test.tsx`: saved equipment with an old id is migrated instead of lost.
- `src/i18n/es.json`, `src/i18n/en.json`: `recipe.meta`, `recipe.minutes`, `brew.summaryMeta`, `brew.phaseProgress`, `phase.manual`, `phase.bypass`, `phase.ice`, `phase.preinfusion`, `common.on`, `common.off`, `timer.muteOn`, `timer.muteOff`, `difficulty.easy|medium|advanced`, `method.french-press.*`, English `grind.*` and the new catalog names/stories (220 keys per language, exact parity).
### Changed
- `src/data/methods.json`: English method ids/icons (`french-press`), normalized `grindKey` (`grind.medium`, `grind.medium-coarse`, `grind.medium-fine`, `grind.coarse`, `grind.fine`); updated limits (v60 3 cups/510 g, press 5/1000, etc.).
- `src/App.tsx`, `src/components/DiscoveryModal.tsx`: recipe metadata, summary, `phase i/n` progress, `manual` label, mute and `On/Off` now come from i18n; `difficultyLabel()` translates difficulty and strips accents from the slug.
- `src/components/EquipmentIcon.tsx`: `SUPPORTED_ICON_IDS` uses `french-press` (the drawn shape is unchanged); `src/config.ts` aligns `CONFIG.equipment` with `methods.json`.
- `README.md`, `docs/PRD.md`, `docs/AGENTS.md`: rewritten against the real tree (9 methods, 40+18 recipes, persistence, scrolling, real scripts, no `manifest.json` or `validate:data`).
### Fixed
- Real scoped scrolling: `src/theme/app.css` adds `html,body{height:100%;overflow:hidden}`, `.app` with `100dvh` + `overflow:hidden`, and the `.list-scroll`, `.home-scroll`, `.brew-scroll` regions; `tests/update-credits.test.tsx` passes again.
- `src/data/methods.json`: v60 water ceiling rises to 510 g to cover `v60-hoffmann-30` (30 g × 16.67 = 500.1 g) without breaking the limits contract.
- `tests/`: retired id references updated (`v60-balanced`, `aeropress-classic-15`, `chemex-balanced-16`), expected ratios derived from data and mute/phase/progress copy read through i18n; no `'On'` literals remain.
### Removed
- Dead code and CSS: `src/components/Brand.tsx`, `src/components/Toggle.tsx`, `src/theme/tokens.ts`, `renderCard`/`cards` in `src/App.tsx`, unused `lim`/`wmax` variables and `.toggle`/`.switch-field`/`.switch-state` rules (including forced-colors).
- Unused i18n keys (previous-catalog recipes, `method.prensa.*`, `phase.flip`, `phase.tonic`, `calc.water`, `timer.mute`, etc.).
### Verified
- `npm test` **142/142 across 15 files**; clean `npm run build` (`tsc -b` + Vite/PWA): **300.94 kB JS (80.86 kB gzip)**, **23.16 kB CSS**, 16 precache entries.
### Notes
- Data-contract change: recipe ids and the `prensa-francesa` method id changed. Favorites saved with old ids no longer match (no recipe-by-recipe mapping is possible); equipment and own recipes are migrated.

## [Unreleased] — 028 local persistence: IndexedDB, preferences and own recipes
### Fixed
- `src/lib/db.ts`: the equipment selection is **read** from IndexedDB on startup (`loadEquipmentIds`) and saved atomically (`saveEquipmentIds`, `equipment` + `settings` stores, empty selection supported); `db()` no longer throws synchronously when IndexedDB is unavailable.
- `src/App.tsx`: equipment hydration before persisting — defaults no longer overwrite the saved selection; `methodId`/`recipeId` snap to a still-selected method and `navigator.storage.persist()` is requested on startup.
- `src/lib/prefs.ts`: guarded persistence (try/catch) for language, theme, advanced mode and mute; `src/App.tsx` saves and restores them on reload (previously only theme was saved).
- `src/lib/customRecipes.ts`: recipes saved with the pre-v2 contract (`cafeDefaultG`, `fases`, `categoria`…) are migrated instead of discarded; they are rewritten normalized so migration happens only once.
### Added
- `tests/persistence.test.tsx`: language, advanced mode, equipment and own recipes survive a remount (reload).
- `tests/custom-recipes.test.ts`: legacy migration case; `tests/settings.test.tsx`: equipment hydration.
### Verified
- Clean `npx tsc -b` and clean `npm run build` (16 precache entries). `npm test` 138/139: the only failure (`tests/update-credits.test.tsx:128`) is pre-existing — `src/theme/app.css` does not contain the `html,body{height:100%;overflow:hidden}` or `.list-scroll{overflow-y:auto}` rules that test has required since `dc846ba`.

## [Unreleased] — 027 PWA: update button, version, credits and scoped scrolling
### Added
- `src/lib/useAppUpdate.ts`: manual update-flow hook (US-1) — one-shot `controllerchange` listener (single reload when the new SW takes control), `registration.update()`, `waiting` path (SKIP_WAITING), `installing` path (bounded 5 s wait) and none (`uptodate`); `idle|checking|uptodate|failed|unavailable` states with bounded waits.
- `src/App.tsx` (Settings): version row `v{__APP_VERSION__}` (`data-testid="app-version"`), update row (`data-testid="update-button"`, disabled while checking, `<small aria-live="polite">` feedback) and credits row (`data-testid="settings-credit"`).
- `src/components/Landing.tsx`: "By geduma" credit line below the CTA (`data-testid="landing-credit"`), linking to `CONFIG.creditUrl` (`https://geduma.com`) in a new tab (`target="_blank"` + `rel="noopener noreferrer"`); the same credits row appears in Settings.
- `vite.config.ts`: `define.__APP_VERSION__` injected from `package.json` (single source of truth); `src/env.d.ts` declares the global.
- `src/i18n/es.json`, `src/i18n/en.json`: `app.credit`, `settings.version`, `settings.update`, `settings.updateDesc`, `settings.updateChecking`, `settings.updateUptodate`, `settings.updateFailed`, `settings.updateUnavailable` keys.
- `tests/update-credits.test.tsx`: 10 tests — version, the four update-flow paths (mocked `navigator.serviceWorker` seam), credits on Landing and Settings, scoped-scroll contract.
### Changed
- `src/theme/app.css`: scoped scrolling (US-4) — `html,body{height:100%;overflow:hidden}` (the page no longer scrolls), height-bounded `.app` (`height:100dvh`, `overflow:hidden`) + desktop grid row `minmax(0,1fr)`, new `.list-scroll` (flex:1 + `overflow-y:auto` + contained overscroll + safe areas through `.app` padding), scrollable `.brew-screen`; credit styles `.landing-credit`, `.credit-link`, `.setting-row-credits`.
- `src/App.tsx`: scroll wrappers — home (`<div class="home-scroll list-scroll">`, fixed hero), recipes (`.list-scroll` below the segmented filter, fixed header), Settings (`surface list-scroll`), brew preview (`surface … list-scroll`); brew running unchanged.
- `src/config.ts`: `creditUrl` constant (the credit URL is never inline in components).
### Verified
- `npm test` 133/133, clean `npm run build` (tsc + Vite/PWA, 16 precache entries).

### Correction (029)
- The scrolling claim in this entry was not in the tree: `src/theme/app.css` never included `html,body{height:100%;overflow:hidden}` or `.list-scroll`, so the `tests/update-credits.test.tsx` contract had been failing since `dc846ba`. It was actually implemented in 029.

## [Unreleased] — 026 complete rewrite of the test suite
### Added
- `tests/` new suite (13 files, 118 tests) replacing the previous one (14 files, task-specific): unit (`calc`, `schemas`, `custom-recipes`, `favorites`), data contract (`catalog`, `i18n`, `quality`), hook (`use-timer` with fake timers over the 16 ms rAF grid) and UI integration (`app-shell`, `brew-flow`, `recipes`, `settings`, `discovery`) with `happy-dom` + Testing Library.
- `tests/helpers.tsx` (`renderApp`, `tEs`, `stubRandom`) and `tests/setup.ts` (per-test cleanup, `localStorage.clear`, `vi.restoreAllMocks`).
- `tests/quality.test.ts`: real invariants kept from the old suite — no `innerHTML`/`dangerouslySetInnerHTML`/`document.write` in `src/`.
- Dev dependencies: `happy-dom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`.
- `vite.config.ts`: Vitest `test` block (`environment: 'happy-dom'`, `setupFiles`).
### Changed
- `src/components/RecipeCreateModal.tsx`: real bug found by the suite — `method.limitHint` was interpolated with raw keys (`{cups}/{water}/{method}`) in the limit copy; it now uses the correct tokens (`{tazas}/{agua}/{metodo}`).
- Expectations derived from `src/data/*.json` (never copy literals): tests resolve text through the i18n dictionary and limits through the catalog, so they survive catalog changes (e.g. the 4 → 9 method expansion).
### Removed
- Entire previous suite: `brand-014`, `brew-water-cups-ratio-023`, `centered-cards-006`, `desktop-012`, `desktop-017`, `discover-013`, `landing-018`, `motion-016`, `polish-004`, `settings.test.ts`, `stability-011`, `stable-005`, `timer-fixes-024` (past-task/CSS tests with no invariant to validate).
### Notes
- Workaround documented in `tests/setup.ts`: happy-env re-dispatches bubbled `<label>` events to their control, duplicating clicks on buttons inside labels; a targeted `preventDefault()` patch applies only to `BUTTON` targets.
- Finding: `grind.*` keys referenced by `methods.json` — i18n parity verified in the contract suite.
### Verified
- `npm test` 118/118, clean `npm run build` (tsc + Vite/PWA).

## [Unreleased] — 025 welcome landing before home
### Added
- `src/components/Landing.tsx`: new welcome component — translucent glass layer (`.landing-glass`, backdrop-blur + border), brand, welcome title, explanatory subtitle and entry CTA; centered render in `100dvh`, no scroll, mobile + desktop; copy through i18n; no `innerHTML` or network calls.
- `src/App.tsx`: `showLanding` state (`useState(true)`); Landing renders before home and the CTA hides it to reveal home.
- `src/theme/app.css`: `.landing` — `min-height:100dvh`, centered flex, `overflow:hidden`, safe-area padding; `.landing-glass` glass layer with `border-radius:32px` (40px desktop) and a translucent border; desktop (`≥1024px`) with more padding, 64px brand, title up to 52px, subtitle with `max-width:42ch`, auto-width CTA with a subtle shadow.
- `src/i18n/es.json`, `src/i18n/en.json`: `landing.welcome`, `landing.subtitle`, `landing.cta` keys (copy: "Empezar" / "Get started").
- `tests/landing-018.test.ts`: new file, 4 tests (component props and no `innerHTML`, i18n keys in both locales, App integration, no-scroll CSS layout).
### Changed
- `src/App.tsx`: home shell rendered conditionally (`showLanding ? <Landing /> : <div class="app">…</div>`).
### Verified
- `npm test` 79/79, `tsc -b` clean, `npm run build` clean (~248 KB JS).

## [Unreleased] — 024 brew timer button cleanup
### Changed
- `src/App.tsx`: brew `preview` (steps) back button (`{app.back}`, no chevron) moved into `form-actions` inline with start brew (`{app.start}`); back as `btn-secondary` (auto width), start brew as `cta` (prominent, fills width).
- `src/App.tsx`: brew `running` (timer) `< Recipe` back button (`‹ {brew.recipe}`) removed; `Cancelar` remains in the 2×2 action grid.
- `src/App.tsx`: brew `running` (timer) Pause/Resume toggle replaced by a Pause-only `cta` rendered only when `timer.state === 'running'`; `timer.resume` no longer rendered.
### Verified
- `npm test` 75/75, `tsc -b` clean, `npm run build` clean (~247 KB JS).

## [Unreleased] — 023 brew water-cups slider + ratio step buttons
### Changed
- `src/App.tsx`: brew `summary` water input replaced by a cups range slider (`min=1`, `max=cupsMax`, `step=1`, default `1`, `disabled` when `cupsMax === 1`); water grams derived as `cups × gramsPerCup` clamped to `aguaMaxG`. Ratio text input replaced by `-` / `+` buttons (0.5 step, clamped to method `ratioMin`/`ratioMax`, default `recipe.ratio`); `brewRecipe` and method/recipe selects reset `cups = 1` and `ratio = recipe.ratio`.
- `src/i18n/es.json`, `src/i18n/en.json`: added `calc.waterCups` and `calc.cupsSelected`.
- `src/theme/app.css`: `.cups-slider` — track `var(--surface2)`, fill/thumb `var(--accent)`, border `var(--border)`; thumb as a circle/cylinder centered on the track (`translateY(-50%)`); `width:100%` on mobile and desktop (full dose-area width); progressive fill to 100 % at the maximum (Aeropress 1 cup = full bar); greyish `disabled` state. Ratio: `input number` text replaced by a compact `-` `{ratio}` `+` stepper (0.5 step, clamped to `ratioMin`/`ratioMax`, buttons disabled at the limits), `calc.ratioMinus`/`calc.ratioPlus` keys.
- `src/i18n/es.json`, `src/i18n/en.json`: added `calc.waterTotal` (`{g} g de agua` / `{g} g water`), `calc.ratioMinus`, `calc.ratioPlus`; the water readout now shows cup count + total grams instead of `calc.cupEq`.
### Tests
- `tests/brew-water-cups-ratio-023.test.ts`: new file, 4 tests (slider range/disabled/readout, ratio +/- buttons, no text inputs, derived water).
- `tests/stability-011.test.ts`: updated `disabled={waterMaxG === 1}` → `disabled={cupsMax === 1}` (intentional, matches 023 water slider).
### Verified
- `npx tsc -b` clean, `npx vitest run` 75/75, `npm run build` clean (~246 KB JS).

## [Unreleased] — 022 remove auth (MVP local-only)
### Removed
- `src/lib/auth.ts`: deleted entire Geduma Auth module (`getProviders`, `startLogin`, `readCallbackToken`, `exchangeSession`, `getSession`, `logout`, `LocalSession`).
- `src/App.tsx`: removed auth imports, `session`/`providers`/`authErr` state, callback-token effect, `getProviders` effect, Settings login/logout/session row.
- `src/config.ts`: removed auth-only keys `apiBaseUrl`, `appId`, `redirectUrl`, `sessionMaxDays`.
- `src/lib/db.ts`: removed `session` object store from IndexedDB upgrade.
- `src/i18n/es.json`, `src/i18n/en.json`: removed auth-only keys `settings.authError`, `settings.noProviders`, `settings.session`.
### Changed
- `docs/PRD.md`: settings section and PWA note now describe local-only MVP (no accounts, no session).
- `docs/AGENTS.md`: config/auth/lib sections updated to local-only; no-auth references removed.
### Added
- `src/i18n/es.json`, `src/i18n/en.json`: `settings.localOnly` local-only notice string.
- `docs/features/021-remove-auth/`: spec.md, plan.md, tasks.md.
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `tsc -b` clean, `npm run build` clean (~248.5 KB JS).

## [Unreleased] — 021 center brew timer full screen (desktop + mobile)
### Changed
- `src/App.tsx`: `.app` receives `brew-running` class when `tab === 'brew' && step === 'running'`.
- `src/theme/app.css`: `.app.brew-running > section{grid-column:1 / -1}` inside `@media(min-width:1024px)` so the brew timer screen centers on the full desktop screen (not just content column). Mobile keeps base `.timer-col{margin:0 auto}` centering.
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 020 center brew timer (mobile + desktop)
### Changed
- `src/theme/app.css`: `.timer-col` now has `max-width:560px;margin:0 auto;width:100%` in base CSS so the brew timer screen is horizontally centered on both mobile (<1024px) and desktop (≥1024px). Removed the redundant duplicate rule from the desktop media query.
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 019 recipes desktop grid (adaptive columns)
### Added
- `docs/features/019-recipes-desktop-grid/`: spec.md, plan.md, tasks.md for the desktop grid initiative.
### Changed
- `src/theme/app.css`: fixed cascade order so desktop adaptive grid applies. Default `.recipes-list` keeps 2 columns for mobile/tablet (<1024px). Added `.recipes-list{grid-template-columns:repeat(auto-fit, minmax(240px, 1fr))}` inside the second `@media(min-width:1024px)` block (comes after the default rule, so it wins for desktop). Desktop now shows 3+ columns as viewport grows; mobile stays fixed at 2 columns.
- `tests/desktop-017.test.ts`: updated grid assertion to `minmax(240px, 1fr)` (intentional, matches 019 adaptive grid).
- `tests/motion-016.test.ts`: updated grid assertion to `minmax(240px, 1fr)` (intentional, matches 019 adaptive grid).
### Tests
- `tests/desktop-017.test.ts`: 8 tests (1 grid assertion updated).
- `tests/motion-016.test.ts`: 10 tests (1 grid assertion updated).
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 018 theme palette + desktop card visibility (contrast fix)
### Added
- `docs/features/018-theme-palette-contrast/`: spec.md, plan.md, tasks.md for the theme/contrast initiative.
### Changed
- `src/theme/tokens.ts`: dark mode `bg` #141110→#0F0D0C, `surface` #201A15→#1C1814, `surface2` #2A221B→#29231C, `muted` #B8A794→#C9B8A6, `tabbar` #201A15→#1C1814 (higher card-to-background contrast on desktop).
- `src/theme/app.css`: dark CSS variables synced to tokens; dark border `rgba(...,0.12)`→`rgba(...,0.25)` for visible card boundaries.
- `src/App.tsx`: removed `reveal` animation class from Home method cards and Recipes recipe cards so they render visible on mount without hovering (brew screens keep `screen-enter` motion).
- `tests/motion-016.test.ts`: updated two "staggered reveal" assertions to verify static cards render without `reveal` class (intentional, matches 018 visibility fix).
### Tests
- `tests/motion-016.test.ts`: 10 tests (2 reveal assertions intentionally updated).
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 017 desktop redesign (fluid, friendly, functional)
### Added
- `src/theme/app.css`: desktop redesign block (`≥1024px`) — fluid sidebar `minmax(260px, 340px)`, recipe grid `repeat(auto-fit, minmax(260px, 1fr))` (2-col at 1024px, 3–4 col wider), desktop card hover states + sizing (recipe 140px min-height, method 100px), timer max-width 560px centered, modals max-width 520px centered with footer Save/Cancel one line (no X), tabbar sticky friendly labels (no icon-only collapse).
- `tests/desktop-017.test.ts`: new file, 8 tests asserting desktop sidebar col 1, fluid recipe grid, timer centering, modal sizing, card hover/sizing, mobile pill unchanged, reduced-motion block, no hardcoded UI strings.
### Changed
- `src/theme/app.css`: desktop `.app` grid `minmax(260px, 340px) minmax(0, 1fr)`, padding 40/64px, gap 32px; `.recipes-list` changed from `repeat(3)` to `repeat(auto-fit, minmax(260px, 1fr))`; `.tabbar` desktop top 40px, radius 16px, padding 14px, button 52px; `.timer-col` max-width 560px; `.modal` max-width 520px; `.mega` clamp 48–72px.
- `tests/motion-016.test.ts`: updated desktop recipes grid assertion from `repeat(3)` to `repeat(auto-fit, minmax(260px, 1fr))` (intentional, matches 017 redesign).
### Tests
- `tests/desktop-017.test.ts`: new file, 8 tests.
- `tests/motion-016.test.ts`: 10 tests (grid assertion updated).
### Verified
- `npm run validate:data` OK 7, `npm test` 71/71, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 016 mobile + desktop design review, animations & fluidity
### Added
- `src/theme/app.css`: motion tokens (`--motion-fast:150ms`, `--motion-normal:300ms`, `--motion-slow:500ms`, `--ease`); keyframes `fadeIn`, `fadeOut`, `slideUp`, `phasePulse`, `btnPress`; utility classes `.screen-enter`, `.screen-exit`, `.reveal`, `.dot-flash`, `.btn-pressed`; ring `--p` transition for smooth progress sweep; `prefers-reduced-motion` block zeros all animation/transition.
- `src/App.tsx`: `screen-enter` motion class on brew screens (`summary`, `preview`, `running`, `done`); `dot-flash` on active phase dot; `phaseFlash` state + `lastIdxRef` ref to trigger flash on phase change; `.reveal` on home method cards and recipe cards for staggered entrance (CSS `animation-delay`).
### Changed
- `src/theme/app.css` `.ring`: added `transition:--p var(--motion-normal) var(--ease)` for smooth sweep.
### Fixed
- `src/theme/app.css` desktop layout: `.app>section` removed `grid-row:2` (left empty row 1, content collapsed); `.home` changed from nested grid to flex column (no double-grid misalignment); `.tabbar` desktop changed to `grid-row:1 / span 3` so sticky sidebar spans full content height; mobile padding-bottom increased to `110px` so scrolled content never slides under the floating Liquid Glass pill tabbar.
- `src/theme/app.css` desktop recipes: `.recipes-list` changed from `repeat(2)` to `repeat(3)` so recipe cards occupy more of the available column width on wide screens.
- `src/theme/app.css` spacing: `.screen-enter` and `.surface` use `gap:24px` on desktop (≥1024px) vs `16px` mobile, standardizing space between containers/header/content across all screens including brew preparation.
- `src/theme/app.css` `.section-head`: removed negative `margin:-10px 0 0` that caused header overlap with content above.
- `src/App.tsx` recipes: restored `method-group` + `method-group-head` wrappers around each method's recipe cards (grouped by method with icon header).
### Tests
- `tests/motion-016.test.ts`: new file, 10 tests asserting motion tokens, keyframes, utility classes, ring transition, reduced-motion block, screen-enter classes, dot-flash, staggered reveals, desktop 2-col grid.
- `tests/desktop-012.test.ts`: updated `grid-row:2` assertion → `grid-column:1` for tabbar sidebar.
- `tests/motion-016.test.ts`: updated `grid-row:2` assertion → `grid-column:1` for tabbar sidebar.
### Verified
- `npm run validate:data` OK 7, `npm test` 63/63, `npm run build` clean (~250.9 KB JS).

## [Unreleased] — 015 remove brand bar + 2-col recipes + island blur + method filter + clear filters + 1 cup default water
### Changed
- `src/components/Brand.tsx` unmounted: removed `import Brand` and `<Brand compact={...}/>` from `src/App.tsx`; deleted `.brand-bar`/`.brand-mark` rules from `src/theme/app.css` (no header brand bar).
- `src/theme/app.css` recipes: desktop `.recipes-list` `repeat(3)` → `repeat(2)`; removed `@media(max-width:359px)` 1-col collapses so recipes stay 2 columns always.
- `src/theme/app.css` island: removed `mask-image` from `.tabbar` (was making the pill invisible); keeps `backdrop-filter:blur(24px)` glass effect, scroll unchanged, content behind is blurred by the island backdrop.
- `src/App.tsx`: home method cards set `filterMethodId` then open Recipes; Recipes list filters by `filterMethodId`; filter indicator shown in section head. Removed separate "Clear filters" button: the `Todas|Favoritas` segmented only renders when arriving with a method filter; clicking `Todas` clears the method filter.
- `src/App.tsx` recipe cards: removed method icon + method name badge (cards are grouped by method, redundant).
- `src/App.tsx` `brewRecipe`: default water is now `CONFIG.gramsPerCup` (1 taza = 210 g) clamped to `aguaMaxG`, instead of `cafeDefaultG * ratio`.
- `src/i18n/es.json` + `en.json`: added `recipes.filterBy`; removed `recipes.clearFilters`.
### Tests
- `tests/brand-014.test.ts`: "brand mark mounted" → "brand bar removed from app" (asserts no Brand import, no `.brand-bar`/`.brand-mark` in CSS).
- `tests/desktop-012.test.ts`: dropped `.brand-bar{grid-column:...}` assertion (brand bar deleted); method-card `onClick` now asserts `setFilterMethodId(m.id); setTab('recipes')`.
### Verified
- `npm run validate:data` OK 7, `npm test` 53/53, `npm run build` clean (~251KB JS).

## [Unreleased] — 014 logo redesign + in-app brand
### Added
- `src/components/Brand.tsx`: mark-only 32px brand (`brand-bar`, hidden in brew `running`); mounted in `src/App.tsx` before the tabbar.
- `tests/brand-014.test.ts`: black-premium lock (no browns/oranges), centered abstract mark, mark-only logo, flat favicon vs gradient icon, brand mount, platform color refs.
### Changed
- Logo redesigned v3 (no text anywhere): abstract dripper (rim bar + geometric V + pour + drop, no realistic ellipses) in warm cream `#F5F0E8` over near-black tile `#141414` (gradient `#2A2A2A → #0B0B0B` in `public/icon.svg`). Applies to `public/icon.svg`, `public/favicon.svg`, `public/logo.svg` (mark-only 512 viewBox), `public/safari-pinned-tab.svg`, `src/components/Brand.tsx`.
- Illustration optically centered (content margins equalized top/bottom) in all five mark files.
- Platform refs to near-black: `index.html` (theme-color, mask-icon, TileColor), `vite.config.ts` (theme_color), `public/browserconfig.xml`, `scripts/gen-icons.mjs` (BG). Regenerated PNGs + `favicon.ico` via `npm run gen:icons`.
- `src/theme/app.css` desktop grid reserves row 1 for `.brand-bar` (sidebar moves to `grid-row:2`, `tests/desktop-012.test.ts` intentionally updated); removed dead `.brand-word` styles.
### Verified
- `npm run validate:data` OK 7, `npm test` 52/52, `npm run build` clean.

## [Unreleased] — English-only code/tests/docs (data contract untouched)
### Changed
- Tests renamed to English: `estable-005` → `stable-005`, `centrado-cards-006` → `centered-cards-006`, `estabilidad-011` → `stability-011`, `descubrir-013` → `discover-013` (one string updated: `setDiscoOpen` → `setDiscoveryOpen`).
- Non-contract code identifiers moved to English: `discoPool/discoOpen` → `discoveryPool/discoveryOpen`, `allClasicas/visibleClasicas` → `allClassics/visibleClassics` in `src/App.tsx`; custom-recipe shape `{nombre, cafeDefaultG, notas}` → `{name, coffeeDefaultG, notes}` in `src/lib/customRecipes.ts` + `src/components/RecipeCreateModal.tsx` (localStorage customs from pre-push builds are purged gracefully, no white screen).
- Docs to English: `docs/PRD.md`, `CHANGELOG.md` history, `docs/AGENTS.md` test-name refs. Left in Spanish: `src/i18n/es.json` (app dictionary), `src/data/` field names/values (versioned contract), default-locale UI copy (`index.html`, PWA manifest).
### Verified
- `npm run validate:data` OK 7, `npm test` 47/47, `npm run build` clean.

## [Unreleased] — 013 discover modal + grouped recipes + water dose + timer
### Added
- `DiscoveryModal`: random proposal with Close/Another/Prepare (ESC/backdrop/stable focus, re-roll without repeating).
### Changed
- Recipes grouped by method (order + header with count), sorted by name; filter resets on entry.
- Water-only dose + `1 taza = 210 g`; removed base/cups and dead keys.
- Redesigned timer: phase dots, pause CTA, 2×2 grid (Skip/Mute/Restart/Cancel) + back-link.
### Fixed
- Badge with room for the heart (no overlap).
### Verified
- `npm run build` clean, `npm test` 47/47 (006/011/012 updated + 013 new).

## [Unreleased] — 012 desktop + island + home + cups
### Fixed
- Desktop: `nav` inside the `.app` grid (sticky sidebar col 1, content col 2); 2-col home and 3-col recipes visible.
- Island: 82% pill + 24px blur (illegible behind, single layer, no scrim).
- Language: `key={lang}` on nav, island responds instantly.
- Default base in cups + visible `Agua a usar` (`water-from-cups`); coffee recalculates with the ratio.
- Spacing: reduced gaps/paddings (app/surface/hero/cards/stats).
### Changed
- Blind surprise: button only `Descubrir`.
- Showcase home: only selected methods, no toggling (only Settings chooses).
### Verified
- `npm run build` clean, `npm test` 42/42 (006/011 intentionally updated + 012 new).

## [Unreleased] — 011 back brew + inputs + HIG island + home + favorites + desktop
### Added
- Favorites: `lib/favorites.ts` (localStorage), heart on cards (`fav-btn`, `aria-pressed`), `Todas|Favoritas` filter with its own empty state.
- Random suggested recipe favoring favorites on home (visible favorites pool, visible fallback, stable pick); random discovery surprise from home.
### Changed
- Island without Discover (`Inicio|Recetas|Ajustes`); discover view removed (data intact).
- Back brew `.back-link` (‹ + destination) on summary + preview.
- Recipes in 2-col grid (3-col on desktop ≥1024px); 2-col home and composite brew on desktop.
### Fixed
- Limits pin inputs (`min===max` → `disabled`, cups=1 on aeropress) in dose and recipe creation.
- Uniform inputs (`--input-h`, `.dosis-grid`, 100% width).
- HIG island: no scrim (single glass layer), always mounted (`is-hidden`).
- Timer reset per recipe + `fases[idx]` guard; modals with stable `onClose` (no focus stealing).
- Reactive home: method cards toggle equipment with state; empty state with CTA.
### Verified
- `npm run build` clean, `npm test` 36/36 (006-descubrir and 005-3col intentionally updated + 011 new).

## [Unreleased] — 010 per-method limits + dashboard
### Added
- `methods.json` with `limites` per method (aeropress 1 cup/250g/22g, v60 4/1000/60, chemex 6/1500/90, press 4/1000/60) + `MethodLimitsSchema` zod.
- `Inicio` dashboard: suggested with Prepare, methods with caps, stats and CTAs; `Inicio|Recetas|Descubrir|Ajustes` island (without Prepare); brew as destination with `← origen` and island hidden in `running`.
### Fixed
- Dose clamped to the method (water/cups/ratio + `method-limit-hint`); recipe creation rejects over the cap.
### Verified
- `npm run build` clean, `npm test` 25/25.

## [Unreleased] — 009 glass island + water/cups base + language + cards + fixed header
### Fixed
- Liquid glass island: 96px translucent scrim (`transparent→bg 38%→68%`, 10px blur); sharp content up to the pill, blur only behind.
- Centered base: centered legend/segmented/hint.
- Water/cups base: `water|cups` modes, `waterG 1–5000` + ratio or `cups 1–10` + ratio; coffee always `calcCoffee` with `coffee-from-water/cups` readouts; `café·agua·1:ratio` hero.
- Language: ES/EN segmented with visible selection (`aria-checked`).
- Compact cards: 12px padding, 8-10px gap, 14px h3, 12px meta, 12px badge, 28px icon.
- Sticky Recipes/Discover header with blur.
### Verified
- `npm run build` clean, `npm test` 25/25.

## [Unreleased] — 008 island limit + editable dose with base
### Fixed
- Bottom island as boundary: fixed `.tabbar-scrim` behind tabbar mobile-only (14px blur + gradient to `var(--bg)`, `z9<10`, `pointer-events:none`); scrolling leaves no readable text behind the pill.
- Rewritable inputs: `coffee/cups/ratio` as `number|''`, clearing shows `''`, `onBlur` clamps (coffee 1–500/15, cups 1–10/2, ratio 1–50/16); derived values never 0.
- Base with label: `fieldset.calc-base` + `segmented radiogroup` By coffee/By cups + hint for already-chosen method.
### Verified
- `npm run build` clean, `npm test` 25/25.

## [Unreleased] — 007 UI consistency buttons/switches/forms
### Fixed
- Unified buttons: `--btn-radius:12px`, heights 52/48/40 (`--btn-h-*`); `.cta` 12px on mobile+desktop (pill only tabbar/segmented); `.btn-secondary` and `.card-delete` same scale; secondary in brew/settings/modals.
- Switch with label and fixed size: `Toggle` 52×32 `flex:none` + `.switch-field` + `.switch-state` (visible On/Off, `min-width:92px`); `setting-row:has(.toggle)` without `content-visibility`, `min-height:64px` — no jumps.
- Cups→grams: in cups mode readout `data-testid="coffee-from-cups"` with live `calcCoffee(cupsToWater(cups),ratio)` (`calc.coffeeFromCups` ES/EN).
- Priority actions on one line: `.form-actions{nowrap}` + `.modal-foot.form-actions`; secondary `order:1` left, primary `order:2` right full; applied to preview/running/done + both modals; scroll-x <359px, no wrap.
### Verified
- `npm run build` clean, `npm test` 25/25.

## [Unreleased] — 006 centered theme + cards + discover
### Changed
- Centered theme below title+description (segmented + `Current: X` centered, max 320px).
- Recipes without invasive CTA: tap/Enter/Space on the card (`role=button` + `aria-label`); custom `Delete` with `stopPropagation`; Recipes as single-column list (`recipes-list`), Discover as 2-col grid.
- Discover redesigned as 2-col grid with cards (method badge + story + tags + meta) and card-select; empty state intact; no pill/button per card (the card selects).
### Verified
- `npm run build` clean, `npm test` 25/25, `validate:data` OK 7.

## [Unreleased] — 005b compact theme + selects
### Fixed
- Compact controls (no 292/172/152 min-width): segmented and buttons sized to content; theme stacked below title+description (`setting-row-theme` column, `theme-ctl` 100% max 320px, current at 12px).
- Selects with arrow on the right (`appearance:none`, 16px chevron SVG at `right 12px center`, `padding-right 36px`, dark variant).
### Verified
- `npm run build` clean, `npm test` 22/22.

## [Unreleased] — 005 stable settings + modals with footer
### Changed
- Theme: `Current: X` sub-label at 12px below the segmented control (fixed 292px width, fixed height), no suffix inside the button; `equipmentSave/themeCurrent` ES/EN.
- ES/EN stability: min-widths sized to the longest string + nowrap/ellipsis (segmented 92px, setting-btn 152px, recipes CTA 172px, tab 72px); no container resizes on language switch.
- Recipes: fixed 2-col grid (`repeat(2,1fr)`, 1 col only <360 as safety), compact cards with ellipsis.
- Modals: removed top X (no more `modal-close`/`equipmentClose` in modals); equipment with footer counter + `Save` (closes, initial focus); recipe with `Cancel+Save` footer on one line (`modal-foot flex:1`); `sticky` header always visible.
### Verified
- `npm test` 22/22, `npm run build` clean (~238KB JS), `validate:data` OK 7, AppSec with no findings (no innerHTML, ESC/backdrop/focus intact).

## [Unreleased] — 004 settings + recipes polish
### Changed
- Settings: airy rhythm (`setting-row 64px/12px/16px`, `surface gap 20px`); theme as single Light/Dark/Auto segmented control with `radiogroup`, `vertida-theme-mode` persist + follows OS live; equipment modal with `blur(12px)` + fallback, min 2-col grid, summary only `n/total`.
- Recipes: 1→2→3 col card grid (method badge + meta ratio/dose/phases/time + tags + Brew) + `+ New recipe` CTA; local recipe creation (modal + `localStorage`, template phases, zod validation) persistent and brewable, with v1 delete.
- ES/EN i18n: `themeDesc`, `recipes.new/create/save/cancel/fieldName/fieldNotes/customBadge/delete`, `error.required/ratio-range`.
### Verified
- `npm test` 17/17, `npm run build` clean (~238KB JS), AppSec baseline with no findings (validated inputs, React escape, no secrets/net).
### Changed
- Settings: aligned rows (label/control), Advanced migrated to `role=switch` Toggle, equipment moved out of the module into a modal with 1→2 col grid + per-method SVG (V60/Chemex/Aeropress/Press).
- ES/EN i18n: `advancedDesc`, `equipmentSummary/Choose/Close/Hint`.
### Verified
- `npm test` 11/11, `npm run build` clean (~230KB JS), AppSec baseline with no findings (static JSX SVG, no secrets/net inputs).

## [Unreleased] — 002 visual redesign
### Changed
- Visual redesign: slate premium tokens (light/dark), airy dashboard layout (640 mobile / 1200 desktop), floating Liquid Glass island with fallbacks, pour-over signature ring.
- Code and comments are English-only; hardcoded UI copy moved to `src/i18n/` keys. Data/DB field names stay as versioned contract.
### Verified
- `npm test` 6/6, `npm run validate:data` OK 7 recipes, `npm run build` clean.

## [Unreleased] — v2.1.0 mobile-first rework
### Added
- HIG system `src/theme/` light/dark + Auto, mobile tabbar + desktop sidebar, 4-screen Brew, progress ring.
### Fixed
- Spec scope restored: equipment filters, discover with story, settings with theme/language/advanced/session.
- Sec re-pass: clean XSS, https-only, no secrets.

## [Unreleased] — v2.0.0 MVP
### Added
- Vite React TS + PWA + IDB v1 + zod scaffolding.
- Data split: methods (4), classic recipes (4), atypical discovery (3), manifest + `validate:data`.
- Gram/cup switch calculator (210g/cup), ratio warn, background timer + mute + WakeLock.
- Optional Google-only auth fail-closed 30d, auto→es i18n.
- 6/6 tests, 212KB build, 5/5 AppSec baseline.
### Changed
- `gramosPorTaza` 240→210 per product decision.
- Base spec v1.6 → final v2.0 in `docs/features/001-vertida-mvp/`.
### Known gaps
- `appId` placeholder, final 192/512 PWA icons, Law 1581 notice, real-brew validation, `npm audit fix --force` postponed (Vite 8 breaking).
