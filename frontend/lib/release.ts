import manifest from "./release.manifest.json";
import { resolveEnvironment } from "./release.shared";

export type ReleaseManifest = typeof manifest;

/** Coordinated release metadata — source: repo release.json (synced manifest). */
export const RELEASE = {
  productName: manifest.productName ?? "HADRO",
  phase: manifest.phase ?? "V2",
  version: manifest.version,
  build: manifest.build,
  releaseDate: manifest.releaseDate,
  codename: manifest.codename,
  environment: resolveEnvironment(manifest.environment),
} as const;

/** User-visible version label, e.g. v2.5.3 */
export function versionLabel(version: string = RELEASE.version): string {
  return `v${version}`;
}

export const VERSION_LABEL = versionLabel();

/** Optional build label for diagnostics, e.g. Build 3 */
export function buildLabel(build: number = RELEASE.build): string {
  return `Build ${build}`;
}
