/** Server-only download helper. No stock writes, no public endpoint.
 * Pass an operator-configured HTTPS URL, exact approved host and secrets.
 * Store validators only after a successful downstream import.
 */
export async function downloadDms14(config: {
  url: string; approvedHost: string; username: string; password: string;
  etag?: string; lastModified?: string; previousSha256?: string;
  maxBytes?: number;
}) {
  const u = new URL(config.url);
  if (u.protocol !== "https:" || u.hostname !== config.approvedHost ||
      u.username || u.password || (u.port && u.port !== "443") ||
      u.hash || !config.username || !config.password || config.username.includes(":"))
    throw new Error("Invalid feed configuration");
  const cap = config.maxBytes ?? 25 * 1024 * 1024;
  if (!Number.isSafeInteger(cap) || cap < 1 || cap > 100 * 1024 * 1024)
    throw new Error("Invalid feed size limit");
  const auth = btoa(Array.from(new TextEncoder().encode(config.username + ":" + config.password), x => String.fromCharCode(x)).join(""));
  const headers = new Headers({Authorization: "Basic " + auth, Accept: "text/csv, application/octet-stream"});
  if (config.etag) headers.set("If-None-Match", config.etag);
  if (config.lastModified) headers.set("If-Modified-Since", config.lastModified);
  const response = await fetch(u, {headers, redirect:"error", signal:AbortSignal.timeout(60000)});
  if (response.status === 304 && config.previousSha256 && (config.etag || config.lastModified))
    return {state:"unchanged" as const};
  if (response.status !== 200 || !response.body) throw new Error("Feed download failed: " + response.status);
  if ((response.headers.get("content-type") || "").includes("text/html") ||
      Number(response.headers.get("content-length")) > cap) {
    await response.body.cancel();
    throw new Error("Unexpected feed response");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > cap) throw new Error("Feed exceeds size limit");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
  if (!size) throw new Error("Empty feed");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk,offset);offset += chunk.length;}
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)), x => x.toString(16).padStart(2,"0")).join("");
  if (sha256 === config.previousSha256) return {state:"unchanged" as const};
  return {state:"downloaded" as const,bytes,sha256,etag:response.headers.get("etag"),lastModified:response.headers.get("last-modified")};
}
