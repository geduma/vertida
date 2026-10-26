/** Every icon this component can draw — methods.json `icon` must belong to this list. */
export const SUPPORTED_ICON_IDS = [
  'v60',
  'chemex',
  'aeropress',
  'french-press',
  'kalita',
  'siphon',
  'clever',
  'espresso',
  'moka',
] as const;

export type IconId = (typeof SUPPORTED_ICON_IDS)[number];

export default function EquipmentIcon({ id, size = 40 }: { id: string; size?: number }) {
  const key = id as IconId;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (key === 'v60') {
    return (
      <svg {...common}>
        <path d="M5 4h14l-5.2 10.2a1.6 1.6 0 0 1-1.4.8h-0.8a1.6 1.6 0 0 1-1.4-.8L5 4Z" />
        <path d="M9 8.5 11 13M13 8.5 12.4 11.5M15 8.5 13.8 12" opacity={0.55} />
        <path d="M9 17.5h6M10.5 15v2.5M13.5 15v2.5" />
        <path d="M3.5 4h17" strokeWidth={2} />
      </svg>
    );
  }
  if (key === 'chemex') {
    return (
      <svg {...common}>
        <path d="M7 3.5h10l1.8 5.2-4.6 4.2v5.6a1.5 1.5 0 0 1-1.5 1.5h-1.4a1.5 1.5 0 0 1-1.5-1.5v-5.6L5.2 8.7 7 3.5Z" />
        <path d="M5.6 8.7h12.8" strokeWidth={2} />
        <path d="M9.8 12.9h4.4" opacity={0.55} />
        <path d="M4.5 3.5h15" strokeWidth={2} />
      </svg>
    );
  }
  if (key === 'aeropress') {
    return (
      <svg {...common}>
        <rect x="8" y="2.5" width="8" height="13" rx={1.5} />
        <rect x="10" y="5" width="4" height="7" rx={0.8} opacity={0.55} />
        <path d="M6 18.5h12M7.5 15.5v3M16.5 15.5v3" />
        <path d="M9.5 2.5v-0M14.5 2.5v-0" strokeWidth={2} />
        <path d="M12 5v4" opacity={0.7} />
      </svg>
    );
  }
  if (key === 'kalita') {
    // Flat-bottom wave dripper on its stand
    return (
      <svg {...common}>
        <path d="M4.5 5.5h15l-2.3 8.5H6.8L4.5 5.5Z" />
        <path d="M8.6 7.6c.9 1.1.9 2.4 0 3.5M12 7.6c.9 1.1.9 2.4 0 3.5M15.4 7.6c.9 1.1.9 2.4 0 3.5" opacity={0.55} />
        <path d="M7.7 14v5.5M16.3 14v5.5M6.5 19.5h11" />
        <path d="M3.5 5.5h17" strokeWidth={2} />
      </svg>
    );
  }
  if (key === 'siphon') {
    // Vacuum pot: upper chamber, tube, lower bulb on a stand
    return (
      <svg {...common}>
        <path d="M9 3.5h6l-1 5h-4L9 3.5Z" />
        <path d="M8.5 3.5h7" strokeWidth={2} />
        <path d="M12 8.5v3" />
        <circle cx="12" cy="15.5" r="4" />
        <path d="M8.7 16.4c1.9 1.1 4.7 1.1 6.6 0" opacity={0.55} />
        <path d="M12 19.5v2M9 21.5h6" />
      </svg>
    );
  }
  if (key === 'clever') {
    // Immersion dripper: steeped cone with the stopper valve below
    return (
      <svg {...common}>
        <path d="M6.5 4.5h11l-1.7 11.5H8.2L6.5 4.5Z" />
        <path d="M9.6 7.5l-.7 5M14.4 7.5l.7 5" opacity={0.55} />
        <path d="M12 16v1.6" />
        <circle cx="12" cy="18.7" r="1.2" opacity={0.6} />
        <path d="M6 4.5h12" strokeWidth={2} />
      </svg>
    );
  }
  if (key === 'espresso') {
    // Small cup on a saucer with crema steam
    return (
      <svg {...common}>
        <path d="M6 9h9v4.2a4.5 4.5 0 0 1-9 0V9Z" />
        <path d="M15 10.2h1.7a2.2 2.2 0 0 1 0 4.4H15" />
        <path d="M8.6 6.4c0-1.3 1.6-1.3 1.6-2.6M11.8 6.4c0-1.3 1.6-1.3 1.6-2.6" opacity={0.55} />
        <path d="M4.5 18.3h11.5" strokeWidth={2} />
      </svg>
    );
  }
  if (key === 'moka') {
    // Moka pot: two frustums, joint flange, lid knob and side handle
    return (
      <svg {...common}>
        <path d="M8.5 21h7l-1.3-7H9.8L8.5 21Z" />
        <path d="M9.8 14h4.4l1.2-6H8.6l1.2 6Z" />
        <path d="M15.1 10.5h1.8a3 3 0 0 1 0 6H14.6" />
        <circle cx="12" cy="6.9" r="1" />
        <path d="M8.8 14h6.4M8.6 8h6.8" strokeWidth={2} />
      </svg>
    );
  }
  // Fallback (and french-press): french press
  return (
    <svg {...common}>
      <path d="M6 4h9v13.5a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 17.5V4Z" />
      <path d="M15 7h2.2a1.8 1.8 0 0 1 0 3.6H15" />
      <path d="M10.5 4v9M10.5 13h0" strokeWidth={2} />
      <circle cx={10.5} cy={13.6} r={1.1} opacity={0.6} />
      <path d="M6 19.5h9" />
    </svg>
  );
}
