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
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(['lucide-react', 'react', 'react-dom']);
    expect(manifest.scripts?.start).toBeUndefined();
    expect(manifest.scripts?.['prepare:data']).toBe('tsx scripts/build-static-data.ts');
  });

  it('has no backend or paid-host configuration', () => {
    expect(fs.existsSync('render.yaml')).toBe(false);
    expect(fs.existsSync('server.ts')).toBe(false);
    expect(fs.existsSync('.env.example')).toBe(false);
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

  it('refreshes KoLmafia data daily without source-branch write access', () => {
    const workflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
    expect(workflow).toContain("cron: '17 6 * * *'");
    expect(workflow).toContain('repository: kolmafia/kolmafia');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('contents: read');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('npm run verify:upstream');
  });
});
