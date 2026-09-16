const express = require("express");
const { google } = require("googleapis");
const { createOAuthClient } = require("../googleClient");

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not logged in. Visit /auth/google first." });
  }
  next();
}

function getGmailClient(req) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

// Small helper: pull a header value (like "Subject" or "From") out of Gmail's message format
function getHeader(headers, name) {
  const found = headers.find((h) => h.name === name);
  return found ? found.value : "";
}

// Gmail nests the actual email body inside "parts" (for multi-part emails —
// e.g. plain text + HTML versions bundled together). This digs through that
// structure to find the plain text version and decode it from base64url.
function extractPlainTextBody(payload) {
  function decode(data) {
    return Buffer.from(data, "base64").toString("utf-8");
  }

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decode(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractPlainTextBody(part);
      if (result) return result;
    }
  }

  // Fallback: if no text/plain part found, just use whatever's directly on the body
  if (payload.body?.data) {
    return decode(payload.body.data);
  }

  return "(No readable text content found — this email may be HTML-only or contain only attachments.)";
}

// GET /read/messages — list recent inbox messages with basic info
router.get("/messages", requireLogin, async (req, res) => {
  try {
    const gmail = getGmailClient(req);

    // Step 1: get a list of message IDs (Gmail doesn't give full content here)
    const listResult = await gmail.users.messages.list({
      userId: "me",
      maxResults: 15,
      labelIds: ["INBOX"],
    });

    const messages = listResult.data.messages || [];

    // Step 2: for each ID, fetch just enough metadata to show a preview
    // (format: "metadata" is lighter/faster than fetching the full body for every item)
    const detailed = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });
        const headers = detail.data.payload.headers;
        return {
          id: msg.id,
          subject: getHeader(headers, "Subject"),
          from: getHeader(headers, "From"),
          date: getHeader(headers, "Date"),
          snippet: detail.data.snippet,
        };
      })
    );

    res.json({ messages: detailed });
  } catch (err) {
    console.error("Read list error:", err.message);
    res.status(500).json({ error: "Failed to fetch messages.", details: err.message });
  }
});

// GET /read/messages/:id — full content of one specific message
router.get("/messages/:id", requireLogin, async (req, res) => {
  try {
    const gmail = getGmailClient(req);

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
      format: "full", // "full" = give us everything, including the body
    });

    const headers = detail.data.payload.headers;
    const body = extractPlainTextBody(detail.data.payload);

    res.json({
      id: detail.data.id,
      subject: getHeader(headers, "Subject"),
      from: getHeader(headers, "From"),
      to: getHeader(headers, "To"),
      date: getHeader(headers, "Date"),
      body,
    });
  } catch (err) {
    console.error("Read single message error:", err.message);
    res.status(500).json({ error: "Failed to fetch message.", details: err.message });
  }
});

module.exports = router;
