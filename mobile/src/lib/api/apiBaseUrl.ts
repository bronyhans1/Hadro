/**
 * Resolve the HADRO API origin for native vs web.
 * 127.0.0.0/8 and localhost are loopback: they work on the computer running
 * Metro, but on a physical phone they point at the phone itself.
 */
export function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return h === "localhost" || h === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h);
}

export function packagerHostname(hostUri: string | null | undefined): string | null {
  if (!hostUri) return null;
  const withoutProtocol = hostUri.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const hostPort = withoutProtocol.split("/")[0] ?? "";
  const host = hostPort.startsWith("[")
    ? hostPort.slice(1, hostPort.indexOf("]"))
    : hostPort.split(":")[0];
  const trimmed = host?.trim() ?? "";
  return trimmed || null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * If the configured API URL uses a loopback host, rewrite it to the Expo
 * packager host (the machine serving Metro) while keeping the original port.
 * Web keeps the configured URL so localhost continues to work in the browser.
 */
export function resolveApiBaseUrl(
  configured: string,
  options: { platform: string; packagerHostUri?: string | null }
): string {
  const raw = stripTrailingSlash(configured || "http://localhost:5000");
  if (options.platform === "web") return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (!isLoopbackHostname(url.hostname)) return raw;

  const host = packagerHostname(options.packagerHostUri);
  if (!host || isLoopbackHostname(host)) return raw;

  url.hostname = host;
  return stripTrailingSlash(url.toString());
}
