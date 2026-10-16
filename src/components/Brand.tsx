export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`brand-bar${compact ? ' is-hidden' : ''}`} aria-label="Vertida">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 512 512" width="32" height="32">
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
    </header>
  );
}
