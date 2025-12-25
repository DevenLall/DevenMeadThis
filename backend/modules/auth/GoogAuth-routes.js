const { Router } = require("express");
const { google } = require("googleapis");

const oauthRoutes = Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:3000/google/oauth/callback`;

oauthRoutes.get("/google/oauth/refresh-token", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
  });

  res.redirect(authUrl);
});

oauthRoutes.get("/google/oauth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(500).send(`Google oauth failed`);
  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("Copy and save this token");
    console.log("REFRESH TOKEN ", tokens.refresh_token);
    res.send({
      message: `Copy and save this token`,
      refresh_token: tokens.refresh_token,
    });
  } catch (err) {
    console.error("Error getting token:", err.response?.data || err.message);
    res.status(500).send("Error getting token");
  }
});

module.exports = {oauthRoutes};