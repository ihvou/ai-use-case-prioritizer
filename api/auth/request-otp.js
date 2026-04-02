import {
  AUTH_CONSTANTS,
  allowedDomain,
  buildOtpChallenge,
  checkRateLimit,
  getClientIp,
  isAllowedEmail,
  makeOtpCode,
  normalizeEmail,
} from "../_auth.js";

async function sendOtpEmail(email, code) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.AUTH_EMAIL_FROM || "").trim();
  if (!apiKey || !from) {
    throw new Error("OTP email is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM.");
  }

  const subject = "Your AI Use Case Researcher login code";
  const text = `Your one-time login code is ${code}.\n\nThis code expires in 10 minutes.\nIf you did not request this email, ignore it.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errMsg = data?.error?.message || data?.message || `Email send failed (${response.status})`;
    throw new Error(errMsg);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "Email is required." });
    if (!isAllowedEmail(email)) {
      return res.status(400).json({ error: `Only @${allowedDomain()} emails are allowed.` });
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit({
      key: `otp_request:${ip}:${email}`,
      limit: 5,
      windowSec: 15 * 60,
    });
    if (!limit.ok) {
      return res.status(429).json({ error: `Too many OTP requests. Try again in ${limit.retryAfter}s.` });
    }

    const otpCode = makeOtpCode();
    const challengeToken = buildOtpChallenge(email, otpCode);
    await sendOtpEmail(email, otpCode);

    return res.status(200).json({
      ok: true,
      challengeToken,
      expiresInSec: AUTH_CONSTANTS.OTP_TTL_SEC,
      email,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Failed to send OTP." });
  }
}
