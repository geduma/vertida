import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('018 landing de bienvenida antes del home', () => {
  const landing = readFileSync('src/components/Landing.tsx', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');
  const css = readFileSync('src/theme/app.css', 'utf8');
  const es = readFileSync('src/i18n/es.json', 'utf8');
  const en = readFileSync('src/i18n/en.json', 'utf8');

  it('landing component exists with t + onEnter props and aria label', () => {
    expect(landing).toContain("export default function Landing({ t, onEnter }");
    expect(landing).toContain('aria-label={t(');
    expect(landing).toContain('onEnter');
    expect(landing).not.toContain('dangerouslySetInnerHTML');
    expect(landing).not.toContain('innerHTML');
  });

  it('landing copy keys exist in both es and en i18n', () => {
    for (const dict of [es, en]) {
      expect(dict).toContain('"landing.welcome"');
      expect(dict).toContain('"landing.subtitle"');
      expect(dict).toContain('"landing.cta"');
    }
  });

  it('App integrates Landing behind showLanding state', () => {
    expect(app).toContain("import Landing from './components/Landing'");
    expect(app).toContain("const [showLanding, setShowLanding] = useState(true)");
    expect(app).toContain('<Landing t={t} onEnter={() => setShowLanding(false)} />');
  });

  it('landing CSS provides no-scroll 100dvh layout, mobile and desktop', () => {
    expect(css).toContain('.landing{');
    expect(css).toContain('min-height:100dvh;');
    expect(css).toContain('overflow:hidden;');
    expect(css).toContain('align-items:center;');
    expect(css).toContain('justify-content:center;');
    expect(css).toContain('@media(min-width:1024px){');
    expect(css).toContain('.landing-cta{');
  });
});
