const express = require("express");
const { google } = require("googleapis");
const { createOAuthClient } = require("../googleClient");

const router = express.Router();

// Gmail's API wants the email encoded as a raw MIME message, base64url-encoded.
// This helper builds that from simple to/subject/body fields.
function buildRawMessage({ to, subject, body }) {
  const messageParts = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    body,
  ];
  const message = messageParts.join("\n");

  // Gmail requires base64url (not regular base64) — swap a couple characters
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

router.post("/", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not logged in. Visit /auth/google first." });
  }
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing to, subject, or body." });
  }

  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const raw = buildRawMessage({ to, subject, body });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    res.json({ success: true, messageId: result.data.id });
  } catch (err) {
    console.error("Send error:", err.message);
    res.status(500).json({ error: "Failed to send email.", details: err.message });
  }
});

module.exports = router;
