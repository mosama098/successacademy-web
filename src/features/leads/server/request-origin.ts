export function isAllowedBrowserRequest(
  request: Request,
  environment = process.env.NODE_ENV,
) {
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") return false;

  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  try {
    const requestUrl = new URL(request.url);
    const requestOrigin = new URL(originHeader);
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const allowedOrigin = configuredSiteUrl
      ? new URL(configuredSiteUrl).origin
      : requestUrl.origin;

    if (requestOrigin.origin === allowedOrigin) return true;
    if (environment === "production") return false;

    return isMatchingLoopbackOrigin(requestOrigin, requestUrl);
  } catch {
    return false;
  }
}

function isMatchingLoopbackOrigin(origin: URL, requestUrl: URL) {
  const loopbackHosts = new Set(["localhost", "127.0.0.1"]);
  return origin.protocol === "http:"
    && loopbackHosts.has(origin.hostname)
    && loopbackHosts.has(requestUrl.hostname)
    && origin.port === requestUrl.port;
}
