require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const authRoutes = require("./routes/auth");
const sendRoutes = require("./routes/send");
const readRoutes = require("./routes/read");

const app = express();
// Add your GitHub Pages URL here once deployed, e.g. "https://<username>.github.io"
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // set this in your backend host's env vars for production
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Session = keeps you "logged in" across requests using an encrypted cookie
const isProduction = process.env.NODE_ENV === "production";
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // In production, frontend + backend live on different domains,
    // so the cookie needs sameSite:"none" + secure:true to survive cross-site requests.
    // Locally (http, same-ish origin) the defaults are fine.
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  })
);

app.use("/auth", authRoutes);
app.use("/send", sendRoutes);
app.use("/read", readRoutes);

// Sanity check route — confirms server is alive and env vars loaded
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    clientIdLoaded: !!process.env.GOOGLE_CLIENT_ID,
    clientSecretLoaded: !!process.env.GOOGLE_CLIENT_SECRET,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});