import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * iOS 10.3 / Safari 10.1 guard for Tailwind classes that the build cannot fix:
 * - flex containers must not use gap-* (no flex gap before Safari 14.1; use space-x or space-y),
 * - h-screen / min-h-screen are wrong on iPad Safari (100vh overflows the visible area; use h-full).
 */
const SRC = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

function classStrings(code: string): string[] {
  // Quoted strings and template literals; good enough for className literals in this codebase.
  return [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
}

describe('Safari 10 class usage', () => {
  const offenders = (predicate: (s: string) => boolean) =>
    sourceFiles(SRC).flatMap((file) =>
      classStrings(readFileSync(file, 'utf8'))
        .filter(predicate)
        .map((s) => `${relative(SRC, file)}: "${s.trim()}"`),
    );

  it('flex containers do not rely on gap-*', () => {
    expect(offenders((s) => /(^|\s)(inline-)?flex(\s|$)/.test(s) && /(^|\s)gap-/.test(s))).toEqual([]);
  });

  it('nothing uses h-screen or min-h-screen', () => {
    expect(offenders((s) => /(^|\s)(min-)?h-screen(\s|$)/.test(s))).toEqual([]);
  });
});
