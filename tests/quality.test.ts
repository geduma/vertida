import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function srcFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) srcFiles(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('security quality gates', () => {
  const files = srcFiles('src');

  it('no raw HTML injection (innerHTML / outerHTML assignment)', () => {
    const offenders = files.filter(f => /\.innerHTML\s*=|\.outerHTML\s*=/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('no React HTML injection (dangerouslySetInnerHTML)', () => {
    const offenders = files.filter(f => f.includes('dangerouslySetInnerHTML'));
    expect(offenders).toEqual([]);
  });

  it('no document.write', () => {
    const offenders = files.filter(f => /document\.write/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
