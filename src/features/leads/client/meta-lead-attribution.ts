const META_VISITOR_STORAGE_KEY = "sa_meta_visitor_v1";
const META_CLICK_STORAGE_KEY = "sa_meta_click_v1";
const META_ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1_000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fbclidPattern = /^[A-Za-z0-9._~-]{10,500}$/;
const fbcPattern = /^fb\.1\.(\d{10,16})\.([A-Za-z0-9._~-]{10,500})$/;

type VisitorRecord = { id: string; createdAt: number };
type ClickRecord = { fbclid: string; capturedAt: number };

export type MetaLeadSignals = {
  externalId?: string;
  fbc?: string;
};

declare global {
  interface Window {
    __saMetaAttribution?: MetaLeadSignals;
  }
}

let volatileVisitor: VisitorRecord | null = null;
let volatileClick: ClickRecord | null = null;

export function getMetaLeadSignals(now = Date.now()): MetaLeadSignals {
  if (typeof window === "undefined") return {};

  const storage = readLocalStorage();
  if (!storage) {
    const bootstrapped = window.__saMetaAttribution;
    const bootstrappedId = normalizeExternalId(bootstrapped?.externalId);
    if (bootstrappedId && !volatileVisitor) {
      volatileVisitor = { id: bootstrappedId, createdAt: now };
    }
    const bootstrappedFbc = parseFbc(bootstrapped?.fbc, now);
    if (bootstrappedFbc && !volatileClick) volatileClick = bootstrappedFbc;
  }

  const visitor = readVisitor(storage, now) ?? freshVisitor(now);
  if (visitor) {
    volatileVisitor = visitor;
    writeStorage(storage, META_VISITOR_STORAGE_KEY, visitor);
  }

  const currentFbclid = readFbclid(window.location?.search ?? "");
  const storedClick = readClick(storage, now) ?? (isFreshRecord(volatileClick?.capturedAt, now) ? volatileClick : null);
  const click = currentFbclid
    ? storedClick?.fbclid === currentFbclid
      ? storedClick
      : { fbclid: currentFbclid, capturedAt: now }
    : storedClick;
  if (click) {
    volatileClick = click;
    writeStorage(storage, META_CLICK_STORAGE_KEY, click);
  }

  const signals: MetaLeadSignals = {};
  if (visitor) signals.externalId = visitor.id;
  const fbc = click ? buildFbc(click) : undefined;
  if (fbc) signals.fbc = fbc;
  window.__saMetaAttribution = signals;
  return signals;
}

export function buildMetaAttributionBootstrapScript() {
  const visitorKey = JSON.stringify(META_VISITOR_STORAGE_KEY);
  const clickKey = JSON.stringify(META_CLICK_STORAGE_KEY);
  const ttl = String(META_ATTRIBUTION_TTL_MS);
  const skew = String(MAX_CLOCK_SKEW_MS);
  const uuidSource = JSON.stringify(uuidPattern.source);
  const fbclidSource = JSON.stringify(fbclidPattern.source);

  return `!function(w){try{var n=Date.now(),t=${ttl},k=${skew},u=new RegExp(${uuidSource},"i"),c=new RegExp(${fbclidSource}),s=null;try{s=w.localStorage}catch(e){}function r(key){if(!s)return null;try{return JSON.parse(s.getItem(key)||"null")}catch(e){return null}}function f(x){return Number.isInteger(x)&&x>0&&x<=n+k&&n-x<=t}function p(key,value){if(s)try{s.setItem(key,JSON.stringify(value))}catch(e){}}var v=r(${visitorKey});if(!v||!u.test(v.id)||!f(v.createdAt)){v=null;try{var id=w.crypto.randomUUID();if(u.test(id))v={id:id.toLowerCase(),createdAt:n}}catch(e){}}if(v)p(${visitorKey},v);var q=r(${clickKey}),x=new URLSearchParams(w.location.search).get("fbclid");if(!q||!c.test(q.fbclid)||!f(q.capturedAt))q=null;if(x&&c.test(x)&&(!q||q.fbclid!==x))q={fbclid:x,capturedAt:n};if(q)p(${clickKey},q);var a={};if(v)a.externalId=v.id;if(q)a.fbc="fb.1."+q.capturedAt+"."+q.fbclid;w.__saMetaAttribution=a}catch(e){}}(window);`;
}

function freshVisitor(now: number): VisitorRecord | null {
  if (isFreshRecord(volatileVisitor?.createdAt, now)) return volatileVisitor;
  try {
    const id = normalizeExternalId(window.crypto.randomUUID());
    return id ? { id, createdAt: now } : null;
  } catch {
    return null;
  }
}

function readVisitor(storage: Storage | null, now: number) {
  const value = readStorage(storage, META_VISITOR_STORAGE_KEY);
  if (!isRecord(value)) return null;
  const id = normalizeExternalId(value.id);
  return id && isFreshRecord(value.createdAt, now)
    ? { id, createdAt: value.createdAt }
    : null;
}

function readClick(storage: Storage | null, now: number) {
  const value = readStorage(storage, META_CLICK_STORAGE_KEY);
  if (!isRecord(value) || !isValidFbclid(value.fbclid) || !isFreshRecord(value.capturedAt, now)) {
    return null;
  }
  return { fbclid: value.fbclid, capturedAt: value.capturedAt };
}

function readFbclid(search: string) {
  try {
    const value = new URLSearchParams(search).get("fbclid");
    return isValidFbclid(value) ? value : null;
  } catch {
    return null;
  }
}

function buildFbc(click: ClickRecord) {
  const value = `fb.1.${click.capturedAt}.${click.fbclid}`;
  return fbcPattern.test(value) ? value : undefined;
}

function parseFbc(value: unknown, now: number): ClickRecord | null {
  if (typeof value !== "string") return null;
  const match = value.match(fbcPattern);
  if (!match) return null;
  const capturedAt = Number(match[1]);
  return isFreshRecord(capturedAt, now)
    ? { fbclid: match[2], capturedAt }
    : null;
}

function normalizeExternalId(value: unknown) {
  return typeof value === "string" && uuidPattern.test(value) ? value.toLowerCase() : "";
}

function isValidFbclid(value: unknown): value is string {
  return typeof value === "string" && fbclidPattern.test(value);
}

function isFreshRecord(timestamp: unknown, now: number): timestamp is number {
  return typeof timestamp === "number"
    && Number.isInteger(timestamp)
    && timestamp > 0
    && timestamp <= now + MAX_CLOCK_SKEW_MS
    && now - timestamp <= META_ATTRIBUTION_TTL_MS;
}

function readLocalStorage() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readStorage(storage: Storage | null, key: string): unknown {
  if (!storage) return null;
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage | null, key: string, value: object) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Attribution is optional and must never block lead submission.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
