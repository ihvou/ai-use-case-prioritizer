import {
  AUTH_CONSTANTS,
  allowedDomain,
  checkRateLimit,
  getClientIp,
  isAllowedEmail,
  makeSessionToken,
  normalizeEmail,
  setSessionCookie,
  validateOtpChallenge,
} from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    const challengeToken = String(req.body?.challengeToken || "").trim();

    if (!email || !code || !challengeToken) {
      return res.status(400).json({ error: "Email, code, and challengeToken are required." });
    }
    if (!isAllowedEmail(email)) {
      return res.status(400).json({ error: `Only @${allowedDomain()} emails are allowed.` });
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit({
      key: `otp_verify:${ip}:${email}`,
      limit: 12,
      windowSec: 10 * 60,
    });
    if (!limit.ok) {
      return res.status(429).json({ error: `Too many attempts. Try again in ${limit.retryAfter}s.` });
    }

    const validation = validateOtpChallenge({ challengeToken, email, code });
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error || "Invalid OTP." });
    }

    const sessionToken = makeSessionToken(email);
    setSessionCookie(res, req, sessionToken);

    return res.status(200).json({
      ok: true,
      email,
      sessionExpiresInSec: AUTH_CONSTANTS.SESSION_TTL_SEC,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "OTP verification failed." });
  }
}
