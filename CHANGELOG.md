# Changelog

## [Unreleased] — 033 liquid glass, motion and scroll integrity
### Added
- `src/components/TabIcon.tsx`: iconos SVG de trazo para **Home · Recetas · Ajustes** (`aria-hidden`), con etiqueta de texto siempre visible.
- `src/theme/app.css`: sistema de movimiento con `screenIn` + escalonado `riseIn` de 60 ms, entrada de modales, lente deslizante de pestaña (`--active`), barrido del anillo (`@property --p`), feedback de pulsación y respeto total a `prefers-reduced-motion`.
- `src/theme/app.css`: luz ambiental con gradientes radiales CSS para que el vidrio tenga algo que refractar; tokens de vidrio, `--scroll-pad`, `--island-h`, `--on-accent` y superficies sólidas para docks.
- `docs/features/033-liquid-glass-motion-scroll/{spec,plan,tasks}.md`: alcance aprobado y matriz de verificación.
### Changed
- `src/App.tsx`: una sola región de scroll por pantalla (`.home-scroll`, `.list-scroll`, `.screen-scroll`); Home con hero fijo y stats/Discover antes de métodos; Recetas con grupos por método a ancho completo; Ajustes con una única sección desplazable.
- `src/App.tsx`: la barra de pestañas se oculta en **todo** el flujo de preparación (resumen, preview, en marcha y fin), no solo en marcha; cada paso usa un dock inferior sólido con las acciones primarias siempre visibles.
- `src/theme/app.css`: la isla vuelve a ser una capa de vidrio única (`blur(30px) saturate(2)`, relleno al 52 % claro / 54 % oscuro) con borde especular, brillo superior, sombra doble y lente; el dock y los pies de modal son sólidos. En `≥1024px` la isla se convierte en sidebar vertical de 280 px con lente vertical.
- `src/theme/app.css`: se elimina la reserva inferior fija de `110px` del `.app` (banda muerta de ~34 px sobre la isla). Ahora el contenido ocupa la pantalla y cada contenedor reserva `--scroll-pad` (isla 68 + 24 + safe area; **92 px** medidos a 320×568), de modo que el último elemento queda siempre por encima de la isla.
- `src/theme/app.css`: layouts responsive por altura y ancho — timer sin scroll a 320×568 (anillo `clamp()`, círculo interior en %, mega 44–64 px), Recetas 1 columna <360 y 2/3/4 según ancho; Ajustes conserva los anchos fijos de control para el contrato ES↔EN. Las cards de método usan `auto-fit` (2 columnas móvil, 3–4 tablet, 2 en la columna de 1024 y 4 a 1440) y recuperan borde, estado seleccionado y contenido centrado.
- `index.html`: `viewport-fit=cover` y `color-scheme` para safe areas reales en iOS/Android.
### Fixed
- **Modales fuera de pantalla al hacer scroll en Ajustes:** `riseIn` usaba `animation-fill-mode: both`, dejando un `transform: matrix(1,0,0,1,0,0)` permanente en `.settings-body`; eso convertía la sección en *containing block* de `position:fixed` y el backdrop se dibujaba en `y=-529` con el diálogo en `y=-242`. Ahora el fill-mode es `backwards`; medido tras desplazar Ajustes 400 px: `.settings-body` con `transform:none`, backdrop `(0,0,320×568)` y modal `(12,34,296×500)` con el pie a `519 px` dentro de 568.
- Contenido cortado bajo la isla: ninguna lista terminaba por encima de la barra. Ahora los 7 tamaños auditados (320×568 → 1440×900) muestran `lastBottom <= islandTop - 4`.
- CTAs fuera del viewport: resumen, preview y fin usan dock; en 320×568 el CTA de resumen mide `y=508…560`, los botones de preview `508…560` y pausa/skip quedan dentro de 568 sin scroll.
- Un solo contenedor de scroll por pantalla; se elimina el scroll anidado de Recetas y Ajustes.
- **Bordes de Ajustes/Recetas visibles tras la isla:** las hojas móviles se sangran al ancho de la app (`margin-inline:-16px`), pierden bordes laterales/inferior y radio inferior, y su fondo se desvanece en los últimos 84 px. Así la isla ya no muestra el final del contenedor ni líneas duras, solo superficie y contenido difuminados.
- **Cards de métodos vacías:** en 1024 px la rejilla forzaba 4 columnas de 73 px; ahora `auto-fit` da 2 columnas de 155 px en ese ancho y 4 de 164 px a 1440. Se restauran borde, fondo tintado, contenido centrado y check de método activo.
### Verified
- `npm test` **153/153 en 16 archivos**; `npm run build` limpio (`tsc -b` + Vite/PWA): **271.07 kB JS (75.87 kB gzip)**, **33.39 kB CSS**, 16 entradas de precache (antes 269.74 kB / 75.57 kB gzip y 24.24 kB CSS).
- Auditoría headless en 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768 y 1440×900, en claro y oscuro: sin overflow horizontal, sin CTAs ocultos, un solo scroll por pantalla, última fila despejada de isla/sidebar y `blur(30px) saturate(2)` en la isla móvil y el sidebar de escritorio.
- Rejilla de métodos medida: 320→125 px, 390→158, 768→186, 1024→155, 1440→164; sin nombres recortados.
- Contraste oscuro medido: CTA **6.70:1**, tinta/superficie **15.21:1**, muted/superficie **9.15:1**, muted/fondo **10.05:1**.
- Modal de equipos verificado en 320×568 con Ajustes desplazado: pie visible y sin overflow horizontal.

## [Unreleased] — 032 orden de Ajustes y estabilidad ES↔EN
### Changed
- `src/App.tsx` (Ajustes): la fila **Versión** pasa al final, justo antes de la fila de créditos **By geduma** y después del aviso de modo local.
- `src/i18n/es.json`, `src/i18n/en.json`: copy más corto y simétrico entre idiomas (`settings.themeDesc`, `settings.advanced`, `settings.advancedDesc`, `settings.githubDesc`, `settings.feedback*`, `settings.update*`, `settings.localOnly`) y nueva clave `settings.updateCta` (**Buscar** / **Check**) para que el botón de actualizaciones no dependa del texto largo de la fila.
- `src/theme/app.css`: geometría fija por fila — títulos en una línea con `ellipsis`, descripciones con caja reservada de 2 líneas (`line-clamp` + `height:2.8em`), ancho fijo para botones de equipos/actualizaciones/feedback, segmented de Avanzado y `theme-current`; se retira `content-visibility:auto` de las filas para que el scroll no cambie al alternar idioma. En pantallas ≤359 px las etiquetas se apilan sobre el control.
- `tests/update-credits.test.tsx`: contrato de orden (versión penúltima, créditos última) y de geometría fija; `tests/i18n.test.ts`: paridad de longitud del copy de Ajustes (±8 caracteres).
### Verified
- `npm test` **150/150 en 16 archivos**; `npm run build` limpio (`tsc -b` + Vite/PWA): **269.74 kB JS (75.57 kB gzip)**, **24.24 kB CSS**, 16 entradas de precache.

## [Unreleased] — 031 enlaces de proyecto y feedback en Ajustes
### Added
- `src/config.ts`: `repoUrl` (`https://github.com/geduma/vertida`) e `issuesUrl` (`https://github.com/geduma/vertida/issues/new`); las URLs externas siguen sin escribirse inline en componentes.
- `src/components/GitHubIcon.tsx`: marca GitHub en SVG decorativo (`aria-hidden`), sin dependencias nuevas.
- `src/App.tsx` (Ajustes): fila **GitHub** con icono-enlace (`data-testid="settings-github"`, `aria-label`, nueva pestaña con `noopener noreferrer`) y fila **Bugs y comentarios** con botón-enlace que abre un issue nuevo (`data-testid="settings-feedback"`).
- `src/i18n/es.json`, `src/i18n/en.json`: claves `settings.github`, `settings.githubDesc`, `settings.githubOpen`, `settings.feedback`, `settings.feedbackDesc`, `settings.feedbackCta`.
- `src/theme/app.css`: `.github-link` (área táctil 44×44, foco visible) y ancla con estilo de botón en las filas de Ajustes.
- `tests/settings-links.test.tsx`: contrato de URLs, atributos de nueva pestaña, nombre accesible e icono decorativo.
### Verified
- `npm test` 146/146 en 16 archivos; `npm run build` limpio (`tsc -b` + Vite/PWA).

## [Unreleased] — 030 pendientes: tags traducidos, preferencias sin migración, DB v2 y toolchain sin vulnerabilidades
### Added
- `src/i18n/es.json`, `src/i18n/en.json`: **26 claves `tag.*`** para traducir las etiquetas de datos; los diccionarios quedan en **246 claves por idioma** con paridad exacta. `src/App.tsx` resuelve `tagLabel()` y ya no imprime los slugs en inglés.
- `docs/VALIDATION.md`: protocolo de validación en taza para las 40 clásicas + 18 descubrimientos (dosis, agua, ratio, tiempo, tags, tres intentos por receta y criterio de aceptación).
- `docs/PRIVACY.md`: borrador de aviso de privacidad (Ley 1581) en español con resumen en inglés. Deja explícito que **no se recolectan datos de usuario**, que solo se guardan preferencias, favoritos y recetas propias en el almacenamiento local y que no existe base de datos externa.
- `tests/recipes.test.tsx`: las etiquetas de datos se muestran traducidas.
- `package.json`: `engines.node >=22.12.0`, alineado con Vite 8 y Vitest 5.
### Changed
- Toolchain mayor: **Vite 8.3.5**, **Vitest 5.0.5**, **@vitejs/plugin-react 6.1.2**, **vite-plugin-pwa 2.0.0**, **Zod 4.6.7** y TypeScript 5.9.3.
- `src/lib/schemas.ts` migrado a **`zod/mini`** con `.check(...)`: mantiene la misma validación y reduce el bundle frente a Zod 4 completo (~64 kB menos).
- `vite.config.ts`: `pool: 'vmThreads'` para amortiguar el coste de entorno de Vitest 5.
- `src/lib/db.ts`: IndexedDB sube a **v2** y elimina el store `recipes` sin uso; `equipment` + `settings` siguen siendo la única persistencia IndexedDB.
- `tests/i18n.test.ts`: ahora exige claves para `grindKey` y para cada `tag` de los datos, además de nombres, descripciones, instrucciones e historias.
- `src/i18n/*.json`: el aviso de modo local dice explícitamente "sin cuenta ni servidor; tus datos no salen de tu dispositivo", en línea con `docs/PRIVACY.md`.
- `README.md`, `docs/PRD.md`, `docs/AGENTS.md`: cifras reales (143 tests, 267.18 kB JS, 0 vulnerabilidades), persistencia v2, tags traducidos y enlaces a los documentos nuevos.
### Fixed
- Favoritos: se decidió **no conservar** los guardados con ids pre-v2. Dejan de coincidir y el usuario puede borrar sus datos; no se inventa un mapeo receta a receta. La migración de método (`prensa-francesa`) y de campos en recetas propias se mantiene porque es contenido, no preferencia.
- `npm audit`: de **11 vulnerabilidades (2 críticas, 3 altas)** a **0**, sin `--force` y con tests/build verdes.
- Bundle: de 300.94 kB (80.86 kB gzip) a **267.18 kB (74.90 kB gzip)** pese a subir de major el toolchain.
### Removed
- Store IndexedDB `recipes` (reservado y sin uso desde su creación).
- Dependencia implícita de Zod 4 completo en el bundle de producción.
- Cualquier migración de favoritos pre-v2: se acepta que las preferencias viejas se pierdan.
### Verified
- `npm test` **143/143 en 15 archivos**; `npm run build` limpio (`tsc -b` + Vite 8/PWA): **267.18 kB JS (74.90 kB gzip)**, **22.86 kB CSS**, 16 entradas de precache; `npm audit` **0 vulnerabilidades**.
### Notes
- El aviso de privacidad es un **borrador** con placeholders de responsable y contacto; no afirmar cumplimiento legal hasta la revisión.
- La validación en taza **no se ejecutó**: `docs/VALIDATION.md` es el protocolo, no evidencia.
- No volver a importar `zod` completo: el bundle crece ~64 kB y rompe el NFR de tamaño.
- Vitest 5 tarda ~40 s en 15 archivos (antes ~decenas de segundos menos); es coste de la versión mayor, mitigado con `vmThreads`.

## [Unreleased] — 029 catálogo ampliado, i18n completo y scroll real
### Added
- `src/data/recipes.json`: catálogo clásico ampliado de 18 a **40 recetas** (3–6 por método), con ids en inglés (`v60-balanced`, `chemex-three-pours`, `french-press-light-17`, `moka-partners-12`…), `difficulty` normalizada a `easy|medium|advanced` y `tags` en inglés.
- `src/data/discovery.json`: **18 descubrimientos** atípicos (antes 9), todos con `storyKey`; nuevas claves de instrucción `phase.bypass`, `phase.ice` y `phase.preinfusion` (los tipos de fase del esquema no cambian).
- `src/lib/legacyIds.ts`: mapa `prensa-francesa → french-press` para equipos guardados en IndexedDB y recetas propias antiguas; se aplica al hidratar equipos (`src/App.tsx`) y al normalizar recetas (`src/lib/customRecipes.ts`).
- `tests/custom-recipes.test.ts`: cobertura del mapa de ids legacy; `tests/settings.test.tsx`: un equipo guardado con id antiguo se migra en vez de perderse.
- `src/i18n/es.json`, `src/i18n/en.json`: claves `recipe.meta`, `recipe.minutes`, `brew.summaryMeta`, `brew.phaseProgress`, `phase.manual`, `phase.bypass`, `phase.ice`, `phase.preinfusion`, `common.on`, `common.off`, `timer.muteOn`, `timer.muteOff`, `difficulty.easy|medium|advanced`, `method.french-press.*`, `grind.*` en inglés y los nombres/historias del catálogo nuevo (220 claves por idioma, paridad exacta).
### Changed
- `src/data/methods.json`: ids/iconos de método en inglés (`french-press`), `grindKey` normalizadas (`grind.medium`, `grind.medium-coarse`, `grind.medium-fine`, `grind.coarse`, `grind.fine`); límites actualizados (v60 3 tazas/510 g, prensa 5/1000, etc.).
- `src/App.tsx`, `src/components/DiscoveryModal.tsx`: metadatos de receta, resumen, progreso `fase i/n`, etiqueta `manual`, mute y `On/Off` ahora salen de i18n; `difficultyLabel()` traduce la dificultad y elimina tildes del slug.
- `src/components/EquipmentIcon.tsx`: `SUPPORTED_ICON_IDS` usa `french-press` (la forma dibujada no cambia); `src/config.ts` alinea `CONFIG.equipment` con `methods.json`.
- `README.md`, `docs/PRD.md`, `docs/AGENTS.md`: reescritos sobre el árbol real (9 métodos, 40+18 recetas, persistencia, scroll, scripts reales, sin `manifest.json` ni `validate:data`).
### Fixed
- Scroll acotado real: `src/theme/app.css` añade `html,body{height:100%;overflow:hidden}`, `.app` con `100dvh` + `overflow:hidden`, y las regiones `.list-scroll`, `.home-scroll`, `.brew-scroll`; el test `tests/update-credits.test.tsx` vuelve a pasar.
- `src/data/methods.json`: el tope de agua de v60 sube a 510 g para cubrir la receta `v60-hoffmann-30` (30 g × 16.67 = 500.1 g) sin romper el contrato de límites.
- `tests/`: referencias a ids retirados actualizadas (`v60-balanced`, `aeropress-classic-15`, `chemex-balanced-16`), ratios esperados derivados de datos y textos de mute/fase/progreso vía i18n; ya no quedan literales `'On'`.
### Removed
- Código y CSS muertos: `src/components/Brand.tsx`, `src/components/Toggle.tsx`, `src/theme/tokens.ts`, `renderCard`/`cards` en `src/App.tsx`, variables `lim`/`wmax` sin uso y reglas `.toggle`/`.switch-field`/`.switch-state` (incluido forced-colors).
- Claves i18n sin uso (recetas del catálogo anterior, `method.prensa.*`, `phase.flip`, `phase.tonic`, `calc.water`, `timer.mute`, etc.).
### Verified
- `npm test` **142/142 en 15 archivos**; `npm run build` limpio (`tsc -b` + Vite/PWA): **300.94 kB JS (80.86 kB gzip)**, **23.16 kB CSS**, 16 entradas de precache.
### Notes
- Cambio de contrato de datos: los ids de receta y el id de método `prensa-francesa` cambiaron. Los favoritos guardados con ids viejos dejan de coincidir (no hay mapeo posible receta a receta); equipos y recetas propias sí se migran.

## [Unreleased] — 028 persistencia local: IndexedDB, preferencias y recetas propias
### Fixed
- `src/lib/db.ts`: la selección de equipos se **lee** de IndexedDB al arrancar (`loadEquipmentIds`) y se guarda de forma atómica (`saveEquipmentIds`, stores `equipment` + `settings`, admite selección vacía); `db()` ya no lanza de forma síncrona cuando IndexedDB no está disponible.
- `src/App.tsx`: hidratación de equipos antes de persistir — los valores por defecto ya no sobrescriben la selección guardada; `methodId`/`recipeId` se ajustan a un método aún seleccionado y se solicita `navigator.storage.persist()` al arrancar.
- `src/lib/prefs.ts`: persistencia segura (try/catch) de idioma, tema, modo avanzado y mute; `src/App.tsx` los guarda y restaura al recargar (antes solo se guardaba el tema).
- `src/lib/customRecipes.ts`: migración de recetas guardadas con el contrato pre-v2 (`cafeDefaultG`, `fases`, `categoria`…) en lugar de descartarlas; se reescriben normalizadas para migrar una sola vez.
### Added
- `tests/persistence.test.tsx`: idioma, modo avanzado, equipos y recetas propias sobreviven a un remount (recarga).
- `tests/custom-recipes.test.ts`: caso de migración legacy; `tests/settings.test.tsx`: hidratación de equipos.
### Verified
- `npx tsc -b` limpio y `npm run build` limpio (16 entradas de precache). `npm test` 138/139: el único fallo (`tests/update-credits.test.tsx:128`) es preexistente — `src/theme/app.css` no contiene las reglas `html,body{height:100%;overflow:hidden}` ni `.list-scroll{overflow-y:auto}` que ese test exige desde `dc846ba`.

## [Unreleased] — 027 PWA: update button, version, credits y scroll acotado
### Added
- `src/lib/useAppUpdate.ts`: hook del flujo de actualización manual (US-1) — listener `controllerchange` one-shot (recarga única al tomar control el SW nuevo), `registration.update()`, camino `waiting` (SKIP_WAITING), `installing` (espera acotada 5 s) y ninguno (`uptodate`); estados `idle|checking|uptodate|failed|unavailable` con esperas acotadas.
- `src/App.tsx` (Ajustes): fila de versión `v{__APP_VERSION__}` (`data-testid="app-version"`), fila de actualización (`data-testid="update-button"`, deshabilitado mientras comprueba, feedback `<small aria-live="polite">`) y fila de créditos (`data-testid="settings-credit"`).
- `src/components/Landing.tsx`: línea de crédito "By geduma" debajo del CTA (`data-testid="landing-credit"`), enlace a `CONFIG.creditUrl` (`https://geduma.com`) que abre en pestaña nueva (`target="_blank"` + `rel="noopener noreferrer"`); en Ajustes la fila de créditos idéntica.
- `vite.config.ts`: `define.__APP_VERSION__` inyectado desde `package.json` (fuente única de verdad); `src/env.d.ts` declara el global.
- `src/i18n/es.json`, `src/i18n/en.json`: claves `app.credit`, `settings.version`, `settings.update`, `settings.updateDesc`, `settings.updateChecking`, `settings.updateUptodate`, `settings.updateFailed`, `settings.updateUnavailable`.
- `tests/update-credits.test.tsx`: 10 tests — versión, los cuatro caminos del flujo de actualización (seam mockeado de `navigator.serviceWorker`), créditos en Landing y Ajustes, contrato de scroll acotado.
### Changed
- `src/theme/app.css`: scroll acotado (US-4) — `html,body{height:100%;overflow:hidden}` (la página deja de scrollear), `.app` height-bounded (`height:100dvh`, `overflow:hidden`) + fila de grid desktop `minmax(0,1fr)`, nuevo `.list-scroll` (flex:1 + `overflow-y:auto` + overscroll contenido + safe areas vía padding de `.app`), `.brew-screen` scrolleable; estilos de crédito `.landing-credit`, `.credit-link`, `.setting-row-credits`.
- `src/App.tsx`: wrappers de scroll — home (`<div class="home-scroll list-scroll">`, hero fijo), recetas (`.list-scroll` bajo el filtro segmentado, cabecera fija), Ajustes (`surface list-scroll`), brew preview (`surface … list-scroll`); brew running sin cambios.
- `src/config.ts`: constante `creditUrl` (la URL del crédito nunca va inline en componentes).
### Verified
- `npm test` 133/133, `npm run build` limpio (tsc + Vite/PWA, 16 entradas de precache).

### Corrección (029)
- La afirmación de scroll de esta entrada no estaba en el árbol: `src/theme/app.css` nunca incluyó `html,body{height:100%;overflow:hidden}` ni `.list-scroll`, por lo que el contrato de `tests/update-credits.test.tsx` fallaba desde `dc846ba`. Se implementó de verdad en 029.

## [Unreleased] — 026 reescritura completa de la suite de tests
### Added
- `tests/` nueva suite (13 archivos, 118 tests) que reemplaza la anterior (14 archivos, orientada a tareas puntuales): unit (`calc`, `schemas`, `custom-recipes`, `favorites`), contrato de datos (`catalog`, `i18n`, `quality`), hook (`use-timer` con fake timers sobre la rejilla rAF de 16 ms) e integración UI (`app-shell`, `brew-flow`, `recipes`, `settings`, `discovery`) con `happy-dom` + Testing Library.
- `tests/helpers.tsx` (`renderApp`, `tEs`, `stubRandom`) y `tests/setup.ts` (cleanup por test, `localStorage.clear`, `vi.restoreAllMocks`).
- `tests/quality.test.ts`: invariantes reales conservados de la suite vieja — sin `innerHTML`/`dangerouslySetInnerHTML`/`document.write` en `src/`.
- Dependencias dev: `happy-dom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`.
- `vite.config.ts`: bloque `test` de Vitest (`environment: 'happy-dom'`, `setupFiles`).
### Changed
- `src/components/RecipeCreateModal.tsx`: fix real detectado por la suite — `method.limitHint` se interpolaba con claves crudas (`{cups}/{water}/{method}`) en el copy del límite; ahora con los tokens correctos (`{tazas}/{agua}/{metodo}`).
- Expectativas derivadas de `src/data/*.json` (nunca literales de copy): los tests resuelven textos vía el diccionario i18n y límites vía el catálogo, por lo que sobreviven cambios de catálogo (p. ej. la expansión de 4 → 9 métodos).
### Removed
- Suite anterior completa: `brand-014`, `brew-water-cups-ratio-023`, `centered-cards-006`, `desktop-012`, `desktop-017`, `discover-013`, `landing-018`, `motion-016`, `polish-004`, `settings.test.ts`, `stability-011`, `stable-005`, `timer-fixes-024` (tests de tareas pasadas/CSS, sin invariante que validar).
### Notes
- Workaround documentado en `tests/setup.ts`: happy-env re-dispara eventos burbujeados de `<label>` a su control, duplicando clicks en botones dentro de labels; parche `preventDefault()` dirigido solo a targets `BUTTON`.
- Hallazgo: claves `grind.*` referenciadas por `methods.json` — verificado paridad i18n en la suite de contrato.
### Verified
- `npm test` 118/118, `npm run build` limpio (tsc + Vite/PWA).

## [Unreleased] — 025 landing de bienvenida antes del home
### Added
- `src/components/Landing.tsx`: nuevo componente de bienvenida — capa glass translúcida (`.landing-glass`, backdrop-blur + borde), marca, título de bienvenida, subtítulo explicativo y CTA de entrada; render centrado en `100dvh`, sin scroll, mobile + desktop; copy vía i18n; sin `innerHTML` ni llamadas de red.
- `src/App.tsx`: estado `showLanding` (`useState(true)`); el Landing renderiza antes del home y el CTA lo oculta para revelar el home.
- `src/theme/app.css`: `.landing` — `min-height:100dvh`, flex centrado, `overflow:hidden`, padding con safe areas; `.landing-glass` capa de vidrio con `border-radius:32px` (40px desktop) y borde translúcido; desktop (`≥1024px`) con mayor padding, marca 64px, título hasta 52px, subtítulo con `max-width:42ch`, CTA ancho automático con sombra sutil.
- `src/i18n/es.json`, `src/i18n/en.json`: claves `landing.welcome`, `landing.subtitle`, `landing.cta` (copy: "Empezar" / "Get started").
- `tests/landing-018.test.ts`: nuevo archivo, 4 tests (props del componente y sin `innerHTML`, claves i18n en ambos locales, integración en App, CSS layout sin scroll).
### Changed
- `src/App.tsx`: shell del home renderizado condicionalmente (`showLanding ? <Landing /> : <div class="app">…</div>`).
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
- `src/theme/app.css`: `.cups-slider` — track `var(--surface2)`, fill/thumb `var(--accent)`, border `var(--border)`; thumb como círculo/cilindro centrado sobre la track (`translateY(-50%)`); `width:100%` en móvil y desktop (todo el ancho del área de dosis); fill progresivo al 100% en el máximo (Aeropress 1 taza = barra llena); estado `disabled` grisáceo. Ratio: texto `input number` reemplazado por stepper compacto `-` `{ratio}` `+` (paso 0.5, clamp a `ratioMin`/`ratioMax`, botones desactivados en los límites), claves `calc.ratioMinus`/`calc.ratioPlus`.
- `src/i18n/es.json`, `src/i18n/en.json`: añadidas `calc.waterTotal` (`{g} g de agua` / `{g} g water`), `calc.ratioMinus`, `calc.ratioPlus`; readout de agua ahora muestra conteo de tazas + gramos totales en lugar de `calc.cupEq`.
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
- Non-contract code identifiers to English: `discoPool/discoOpen` → `discoveryPool/discoveryOpen`, `allClasicas/visibleClasicas` → `allClassics/visibleClassics` in `src/App.tsx`; custom-recipe shape `{nombre, cafeDefaultG, notas}` → `{name, coffeeDefaultG, notes}` in `src/lib/customRecipes.ts` + `src/components/RecipeCreateModal.tsx` (localStorage customs from pre-push builds are purged gracefully, no white screen).
- Docs to English: `docs/PRD.md`, `CHANGELOG.md` history, `docs/AGENTS.md` test-name refs. Untouched Spanish: `src/i18n/es.json` (app dictionary), `src/data/` field names/values (versioned contract), default-locale UI copy (`index.html`, PWA manifest).
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
