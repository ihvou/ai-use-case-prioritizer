import {
  AUTH_CONSTANTS,
  assertAuthConfigured,
  checkRateLimit,
  createSessionToken,
  getClientIp,
  setSessionCookie,
  verifyPasscode,
} from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    assertAuthConfigured();
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Passcode auth is not configured." });
  }

  const passcode = String(req.body?.passcode || "");
  if (!passcode.trim()) {
    return res.status(400).json({ error: "Passcode is required." });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `passcode_login:${ip}`,
    limit: 20,
    windowSec: 10 * 60,
  });
  if (!limit.ok) {
    return res.status(429).json({ error: `Too many attempts. Try again in ${limit.retryAfter}s.` });
  }

  try {
    if (!verifyPasscode(passcode)) {
      return res.status(401).json({ error: "Invalid passcode." });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Passcode verification failed." });
  }

  const sessionToken = createSessionToken();
  setSessionCookie(res, req, sessionToken);
  return res.status(200).json({
    ok: true,
    sessionExpiresInSec: AUTH_CONSTANTS.SESSION_TTL_SEC,
  });
}
