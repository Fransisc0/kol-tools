export interface ManifestFile {
  path: string;
  bytes: number;
  sha256: string;
}

export interface TCRSDataManifest {
  version: 2;
  source: {
    repository: 'kolmafia/kolmafia';
    revision: string | null;
    committedAt: string | null;
  };
  dataFingerprint: string;
  combinations: string[];
  files: ManifestFile[];
  referenceIndex: ManifestFile;
  sourceFiles: ManifestFile[];
}

function isManifestFile(value: unknown): value is ManifestFile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ManifestFile>;
  return (
    typeof candidate.path === 'string' &&
    typeof candidate.bytes === 'number' &&
    Number.isSafeInteger(candidate.bytes) &&
    candidate.bytes > 0 &&
    typeof candidate.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(candidate.sha256)
  );
}

export function isTCRSDataManifest(value: unknown): value is TCRSDataManifest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TCRSDataManifest>;
  return (
    candidate.version === 2 &&
    candidate.source?.repository === 'kolmafia/kolmafia' &&
    (candidate.source.revision === null ||
      (typeof candidate.source.revision === 'string' && /^[0-9a-f]{40}$/.test(candidate.source.revision))) &&
    (candidate.source.committedAt === null ||
      (typeof candidate.source.committedAt === 'string' && Number.isFinite(Date.parse(candidate.source.committedAt)))) &&
    typeof candidate.dataFingerprint === 'string' &&
    /^[0-9a-f]{64}$/.test(candidate.dataFingerprint) &&
    Array.isArray(candidate.combinations) &&
    candidate.combinations.every((entry) => typeof entry === 'string') &&
    Array.isArray(candidate.files) &&
    candidate.files.every(isManifestFile) &&
    isManifestFile(candidate.referenceIndex) &&
    Array.isArray(candidate.sourceFiles) &&
    candidate.sourceFiles.every(isManifestFile)
  );
}
