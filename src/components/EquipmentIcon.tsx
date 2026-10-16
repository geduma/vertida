type IconId = 'v60' | 'chemex' | 'aeropress' | 'prensa';

export default function EquipmentIcon({ id, size = 40 }: { id: string; size?: number }) {
  const key = (id === 'prensa' ? 'prensa' : id) as IconId;
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
