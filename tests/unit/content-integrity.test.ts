import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { SERVED_AREAS } from '../../src/lib/schema';

function frontmatter(path: string): Record<string, unknown> {
  const raw = readFileSync(path, 'utf-8');
  const block = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!block) throw new Error(`no frontmatter in ${path}`);
  const out: Record<string, unknown> = {};
  for (const line of block[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const ids = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));

describe('content inventory', () => {
  it('has the expected number of entries in each collection', () => {
    expect(ids('src/content/services')).toHaveLength(5);
    expect(ids('src/content/areas')).toHaveLength(6);
    expect(ids('src/content/projects')).toHaveLength(1);
  });

  it('ships no testimonials: only real, permissioned ones may be added later', () => {
    expect(ids('src/content/testimonials')).toEqual([]);
  });
});

describe('cross-collection references resolve', () => {
  const serviceIds = ids('src/content/services');

  it('every project service points at a real service', () => {
    for (const project of ids('src/content/projects')) {
      expect(serviceIds, project).toContain(frontmatter(`src/content/projects/${project}.md`).service);
    }
  });

  it('every area lists only real services', () => {
    for (const area of ids('src/content/areas')) {
      const raw = readFileSync(`src/content/areas/${area}.md`, 'utf-8');
      const block = raw.split('\nservices:\n')[1] ?? '';
      const listed = [...block.matchAll(/^  - ([a-z-]+)$/gm)].map((m) => m[1]);
      expect(listed.length, area).toBeGreaterThan(0);
      for (const svc of listed) expect(serviceIds, area).toContain(svc);
    }
  });

  it('JSON-LD areaServed matches the area pages', () => {
    const towns = ids('src/content/areas').map((a) => String(frontmatter(`src/content/areas/${a}.md`).town));
    expect([...towns].sort()).toEqual([...SERVED_AREAS].sort());
  });
});

describe('no fabricated claims', () => {
  it('has no prices, ratings or review numbers in content', () => {
    const files = ['services', 'areas', 'projects'].flatMap((d) => ids(`src/content/${d}`).map((i) => `src/content/${d}/${i}.md`));
    for (const file of files) {
      const raw = readFileSync(file, 'utf-8');
      expect(raw, file).not.toMatch(/\$\d|\b4\.8\d?\b|\b\d+ reviews\b|LawnStarter/i);
    }
  });
});

describe('area pages are not templated duplicates', () => {
  it('gives every area a distinct localNote of real length', () => {
    const notes = ids('src/content/areas').map((a) => {
      const raw = readFileSync(`src/content/areas/${a}.md`, 'utf-8');
      const m = raw.match(/localNote: >-\n([\s\S]*?)\n\w+:/);
      if (!m) throw new Error(`no localNote in ${a}`);
      return m[1].replace(/\s+/g, ' ').trim();
    });
    for (const note of notes) expect(note.length).toBeGreaterThanOrEqual(200);
    expect(new Set(notes).size).toBe(notes.length);
  });
});
