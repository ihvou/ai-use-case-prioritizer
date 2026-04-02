import crypto from "node:crypto";

const AUTH_COOKIE_NAME = "uc_auth";
const OTP_TTL_SEC = 10 * 60;
const SESSION_TTL_SEC = 12 * 60 * 60;
const DEFAULT_ALLOWED_DOMAIN = "ciklum.com";

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

function tokenSecret() {
  const value = String(process.env.AUTH_TOKEN_SECRET || "").trim();
  if (!value) {
    throw new Error("AUTH_TOKEN_SECRET is not configured.");
  }
  return value;
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

function hashOtp(email, code, secret) {
  return crypto
    .createHash("sha256")
    .update(`${email}|${code}|${secret}`)
    .digest("hex");
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

function clearAuthCookie(req) {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function normalizeEmail(input) {
  return String(input || "").trim().toLowerCase();
}

export function allowedDomain() {
  return String(process.env.AUTH_ALLOWED_DOMAIN || DEFAULT_ALLOWED_DOMAIN)
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

export function isAllowedEmail(email) {
  const normalized = normalizeEmail(email);
  const domain = allowedDomain();
  return normalized.endsWith(`@${domain}`);
}

export function makeOtpCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

export function buildOtpChallenge(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const secret = tokenSecret();
  const payload = {
    typ: "otp_challenge",
    email: normalizedEmail,
    codeHash: hashOtp(normalizedEmail, String(code || "").trim(), secret),
    iat: nowSec(),
    exp: nowSec() + OTP_TTL_SEC,
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  return signToken(payload, secret);
}

export function validateOtpChallenge({ challengeToken, email, code }) {
  const secret = tokenSecret();
  const payload = verifyToken(String(challengeToken || ""), secret);
  if (!payload || payload.typ !== "otp_challenge") {
    return { ok: false, error: "Invalid OTP challenge." };
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || payload.email !== normalizedEmail) {
    return { ok: false, error: "Email does not match this OTP challenge." };
  }
  if (!payload.exp || payload.exp < nowSec()) {
    return { ok: false, error: "OTP expired. Request a new code." };
  }
  const candidateHash = hashOtp(normalizedEmail, String(code || "").trim(), secret);
  const a = Buffer.from(String(payload.codeHash || ""));
  const b = Buffer.from(candidateHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: "Invalid OTP code." };
  }
  return { ok: true, payload };
}

export function makeSessionToken(email) {
  const normalizedEmail = normalizeEmail(email);
  const payload = {
    typ: "session",
    email: normalizedEmail,
    iat: nowSec(),
    exp: nowSec() + SESSION_TTL_SEC,
  };
  return signToken(payload, tokenSecret());
}

export function readSession(req) {
  let secret;
  try {
    secret = tokenSecret();
  } catch (_) {
    return null;
  }
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];
  const payload = verifyToken(token, secret);
  if (!payload || payload.typ !== "session") return null;
  if (!payload.exp || payload.exp < nowSec()) return null;
  if (!isAllowedEmail(payload.email)) return null;
  return {
    email: normalizeEmail(payload.email),
    exp: payload.exp,
  };
}

export function setSessionCookie(res, req, token) {
  res.setHeader("Set-Cookie", authCookie(token, SESSION_TTL_SEC, req));
}

export function clearSessionCookie(res, req) {
  res.setHeader("Set-Cookie", clearAuthCookie(req));
}

export function requireAuth(req, res) {
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
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfter: 0 };
}

export const AUTH_CONSTANTS = {
  OTP_TTL_SEC,
  SESSION_TTL_SEC,
};
