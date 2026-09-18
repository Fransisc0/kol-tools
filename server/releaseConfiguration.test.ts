import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Manifest {
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

describe('release configuration', () => {
  it('keeps platform-specific native packages out of direct dependencies', () => {
    const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8')) as Manifest;
    const directNames = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ];
    expect(directNames.some((name) => /-(?:win32|linux|darwin)-/.test(name))).toBe(false);
    expect(manifest.packageManager).toMatch(/^npm@\d+\.\d+\.\d+$/);
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual([
      'compression',
      'express',
      'express-rate-limit',
      'helmet',
    ]);
    expect(manifest.scripts?.start).toBe('node dist/server/server.cjs');
  });

  it('installs build tooling explicitly and prunes it for the Render runtime', () => {
    const renderConfig = fs.readFileSync('render.yaml', 'utf8');
    expect(renderConfig).toContain('npm ci --include=dev');
    expect(renderConfig).toContain('npm prune --omit=dev');
  });

  it('pins every GitHub Action to an immutable full commit SHA', () => {
    const workflows = fs
      .readdirSync('.github/workflows')
      .filter((filename) => filename.endsWith('.yml'))
      .map((filename) => fs.readFileSync(`.github/workflows/${filename}`, 'utf8'))
      .join('\n');
    const actionReferences = [...workflows.matchAll(/uses:\s*[^@\s]+@([^\s#]+)/g)].map((match) => match[1]);
    expect(actionReferences.length).toBeGreaterThan(0);
    expect(actionReferences.every((reference) => /^[a-f0-9]{40}$/.test(reference))).toBe(true);
  });
});
