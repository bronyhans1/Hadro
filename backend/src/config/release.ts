import { readFileSync } from "fs";
import { join } from "path";
import manifest from "./release.manifest.json";

function resolveEnvironment(): string {
  return process.env.NODE_ENV ?? manifest.environment ?? "development";
}

/** Coordinated HADRO API release metadata (see repo release.json). */
export const RELEASE = {
  productName: manifest.productName ?? "HADRO",
  phase: manifest.phase ?? "V2",
  version: manifest.version,
  build: manifest.build,
  releaseDate: manifest.releaseDate,
  codename: manifest.codename,
  environment: resolveEnvironment(),
  apiVersion: manifest.version,
} as const;

export function versionLabel(version: string = RELEASE.version): string {
  return `v${version}`;
}

export function buildLabel(build: number = RELEASE.build): string {
  return `Build ${build}`;
}

/** Fallback: read package.json if manifest missing (legacy deploy paths). */
function readPackageVersionFallback(): string | null {
  try {
    const raw = readFileSync(join(__dirname, "../../package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return typeof pkg.version === "string" ? pkg.version : null;
  } catch {
    return null;
  }
}

export function releaseInfoPayload(): {
  product: string;
  phase: string;
  version: string;
  apiVersion: string;
  build: number;
  releaseDate: string;
  codename: string;
  environment: string;
} {
  const version = RELEASE.version || readPackageVersionFallback() || "0.0.0";
  return {
    product: RELEASE.productName,
    phase: RELEASE.phase,
    version,
    apiVersion: version,
    build: RELEASE.build,
    releaseDate: RELEASE.releaseDate,
    codename: RELEASE.codename,
    environment: RELEASE.environment,
  };
}
