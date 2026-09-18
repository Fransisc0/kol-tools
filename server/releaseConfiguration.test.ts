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
});
