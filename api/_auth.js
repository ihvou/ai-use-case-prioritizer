import crypto from "node:crypto";

const AUTH_COOKIE_NAME = "uc_access";
const SESSION_TTL_SEC = 12 * 60 * 60;
const rateBuckets = new Map();

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(input) {
  const normalized = String(input || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function parseCookies(req) {
  const raw = String(req?.headers?.cookie || "");
  if (!raw) return {};
  return raw.split(";").reduce((acc, pair) => {
    const idx = pair.indexOf("=");
    if (idx <= 0) return acc;
    const key = pair.slice(0, idx).trim();
    const value = decodeURIComponent(pair.slice(idx + 1).trim());
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function isSecureRequest(req) {
  const forwardedProto = String(req?.headers?.["x-forwarded-proto"] || "").toLowerCase();
  return forwardedProto === "https" || process.env.NODE_ENV === "production";
}

function authCookie(token, maxAgeSec, req) {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  const value = encodeURIComponent(token);
  return `${AUTH_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function clearAuthCookie(res, req) {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function tokenSecret() {
  const secret = String(process.env.AUTH_TOKEN_SECRET || "").trim();
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is not configured.");
  return secret;
}

function configuredPasscode() {
  const passcode = String(process.env.APP_ACCESS_PASSCODE || "").trim();
  if (!passcode) throw new Error("APP_ACCESS_PASSCODE is not configured.");
  return passcode;
}

function signToken(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = base64urlEncode(JSON.stringify(header));
  const p = base64urlEncode(JSON.stringify(payload));
  const body = `${h}.${p}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${body}.${signature}`;
}

function verifyToken(token, secret) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const body = `${h}.${p}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const sigA = Buffer.from(s);
  const sigB = Buffer.from(expected);
  if (sigA.length !== sigB.length) return null;
  if (!crypto.timingSafeEqual(sigA, sigB)) return null;

  try {
    return JSON.parse(base64urlDecode(p));
  } catch (_) {
    return null;
  }
}

function hashBuffer(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest();
}

export function isAuthConfigured() {
  return !!String(process.env.AUTH_TOKEN_SECRET || "").trim()
    && !!String(process.env.APP_ACCESS_PASSCODE || "").trim();
}

export function assertAuthConfigured() {
  tokenSecret();
  configuredPasscode();
}

export function verifyPasscode(inputPasscode) {
  const expected = configuredPasscode();
  const a = hashBuffer(inputPasscode);
  const b = hashBuffer(expected);
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken() {
  const payload = {
    typ: "session",
    subject: "passcode-user",
    iat: nowSec(),
    exp: nowSec() + SESSION_TTL_SEC,
  };
  return signToken(payload, tokenSecret());
}

export function setSessionCookie(res, req, token) {
  res.setHeader("Set-Cookie", authCookie(token, SESSION_TTL_SEC, req));
}

export function readSession(req) {
  if (!isAuthConfigured()) return null;
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token, tokenSecret());
  if (!payload || payload.typ !== "session") return null;
  if (!payload.exp || payload.exp < nowSec()) return null;
  return payload;
}

export function requireAuth(req, res) {
  if (!isAuthConfigured()) {
    res.status(500).json({ error: "Passcode auth is not configured." });
    return null;
  }
  const session = readSession(req);
  if (session) return session;
  res.status(401).json({ error: "Unauthorized." });
  return null;
}

export function getClientIp(req) {
  const header = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  if (header) return header;
  return String(req?.socket?.remoteAddress || "unknown");
}

export function checkRateLimit({ key, limit, windowSec }) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + (windowSec * 1000) });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

export const AUTH_CONSTANTS = {
  SESSION_TTL_SEC,
};
