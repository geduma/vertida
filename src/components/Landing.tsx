import { CONFIG } from '../config';

export default function Landing({ t, onEnter }: { t: (k: string) => string; onEnter: () => void }) {
  return (
    <section className="landing" aria-label={t('landing.welcome')}>
      <div className="landing-glass" aria-hidden="true" />
      <div className="landing-content">
        <span className="landing-mark" aria-hidden="true">
          <svg viewBox="0 0 512 512" width="48" height="48">
            <rect width="512" height="512" rx="116" fill="#141414" />
            <g strokeLinejoin="round" strokeLinecap="round">
              <rect x="96" y="73" width="320" height="36" rx="18" fill="#F5F0E8" />
              <path d="M132 145 L220 301 L292 301 L380 145" fill="none" stroke="#F5F0E8" strokeWidth="38" />
              <rect x="242" y="301" width="28" height="32" rx="14" fill="#F5F0E8" />
            </g>
            <path
              d="M256 341 C276 367 292 385 292 403 A36 36 0 1 1 220 403 C220 385 236 367 256 341 Z"
              fill="#F5F0E8"
            />
          </svg>
        </span>
        <h1 className="landing-title">{t('landing.welcome')}</h1>
        <p className="landing-subtitle">{t('landing.subtitle')}</p>
        <button type="button" className="landing-cta cta" onClick={onEnter}>
          {t('landing.cta')}
        </button>
        <p className="landing-credit">
          <a className="credit-link" data-testid="landing-credit" href={CONFIG.creditUrl} target="_blank" rel="noopener noreferrer">{t('app.credit')}</a>
        </p>
      </div>
    </section>
  );
}
