export function shouldDeployPages(
  eventName: string | undefined,
  localFingerprint: string,
  publishedFingerprint: unknown,
): boolean {
  if (eventName !== 'schedule') return true;
  return typeof publishedFingerprint !== 'string' || publishedFingerprint !== localFingerprint;
}
