/** Shared release resolution (no JSON imports — safe for all runtimes). */
export function resolveEnvironment(manifestEnvironment?: string): string {
  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return manifestEnvironment ?? "development";
}
