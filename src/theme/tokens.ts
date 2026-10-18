export const tokens = {
  color: {
    light: {
      bg: '#ECE7DD',
      surface: '#FFFEFB',
      surface2: '#E3DCCF',
      ink: '#241A12',
      muted: '#6E5E51',
      accent: '#A85A24',
      progress: '#2A7A4B',
      danger: '#B3261E',
      tabbar: '#FFFEFB',
      border: 'rgba(36,26,18,0.10)',
    },
    dark: {
      bg: '#0F0D0C',
      surface: '#1C1814',
      surface2: '#29231C',
      ink: '#F5EDE3',
      muted: '#C9B8A6',
      accent: '#E08A3C',
      progress: '#63C183',
      danger: '#FF8A80',
      tabbar: '#1C1814',
      border: 'rgba(245,237,227,0.25)',
    },
  },
  radius: { s: 10, m: 16, l: 24, full: 999 },
  space: { xs: 4, s: 8, m: 16, l: 24, xl: 32 },
  type: { caption: 13, body: 17, title: 22, hero: 34, mega: 64 },
  bar: { tab: 64, touch: 48 },
} as const;
export type ThemeMode = 'light' | 'dark';
