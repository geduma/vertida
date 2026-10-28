type TabIconId = 'home' | 'recipes' | 'settings';

/**
 * Stroke-only navigation glyphs. They never carry text, so the tab's
 * accessible name stays exactly the localized label.
 */
export default function TabIcon({ id }: { id: TabIconId }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (id === 'recipes') {
    // Pour-over dripper: the product's own signature, not a generic cup.
    return (
      <svg {...common}>
        <path d="M4 4h16l-6 8v6h-4v-6z" />
        <path d="M8 21h8" />
      </svg>
    );
  }

  if (id === 'settings') {
    return (
      <svg {...common}>
        <path d="M4 7h9M17 7h3M4 17h5M13 17h7" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="11" cy="17" r="2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
