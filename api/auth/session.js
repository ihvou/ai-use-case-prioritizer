import { isAuthConfigured, readSession } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const configured = isAuthConfigured();
  if (!configured) {
    return res.status(200).json({ authenticated: false, configured: false });
  }

  const session = readSession(req);
  if (!session) {
    return res.status(200).json({ authenticated: false, configured: true });
  }

  return res.status(200).json({
    authenticated: true,
    configured: true,
    exp: session.exp,
  });
}
