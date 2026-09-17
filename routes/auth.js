const express = require("express");
const { createOAuthClient, SCOPES } = require("../googleClient");

const router = express.Router();

// Step A: user hits this to start login — redirects to Google's consent screen
router.get("/google", (req, res) => {
  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
});

// Step B: Google redirects back here after user clicks "Allow"
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code from Google.");
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    // Redirect back to the frontend — localhost in dev, your deployed URL in production
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).send("Something went wrong during login.");
  }
});

// Quick check: are we currently logged in?
router.get("/status", (req, res) => {
  res.json({ loggedIn: !!(req.session.tokens && req.session.tokens.access_token) });
});

module.exports = router;
