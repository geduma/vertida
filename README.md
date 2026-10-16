<p align="center">
  <img src="public/logo.svg" alt="Vertida — logo" width="96" />
</p>

# Vertida · coffee recipes and timer

100% client-side web, Vite + React TS + IndexedDB + PWA. Bilingual es/en, gram unit.

## Quickstart (verified with node 22.23.3)
```bash
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"
npm i
npm run validate:data  # OK 7 recipes
npm test               # 17/17
npm run dev            # http://localhost:5173
npm run build          # dist/ ~238KB JS
```

Config: `src/config.ts` (`apiBaseUrl https://api.geduma.com`, `appId` placeholder `app_xxx`, `gramsPerCup:210`).
Data: `src/data/methods.json`, `recipes/*.json` (4), `discovery/*.json` (3), `manifest.json`. Adding an official recipe = 1 JSON + 1 manifest line + keys in `src/i18n/es.json/en.json`, then `npm run validate:data`. Creating a homemade recipe = `+ New recipe` button in Recipes (saves to `localStorage`, without touching `data/`).

Auth: Optional Google-only via Geduma Auth. See `docs/features/001-vertida-mvp/spec.md` sec.8.

## Design (mobile-first HIG)
Premium slate tokens in `src/theme/tokens.ts`, styles in `src/theme/app.css`. Light/dark with switch in Settings + Auto (`data-theme`, persists to `localStorage`). Floating Liquid Glass island at the bottom on mobile (pill with blur), floating sidebar ≥1024px on desktop. Brew in 4 screens: summary (hero + controls) → preview → run (signature ring + 64pt) → done. Code and comments in English; copy via `src/i18n/es.json/en.json`; data field names stay as versioned contract.

Privacy: only local email/display/provider 30d, no rawData/salt. Colombian Law 1581 notice pending with lawyer.
