const { Router } = require("express");
const User = require("../models/user.js");
const router = Router();
const { createTokenForUser } = require("../services/authentication.js");

// Step 1: Redirect user to Google's consent screen
router.get("/", (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
});

// Step 2: Google redirects back with a code
router.get("/callback", async (req, res) => {
  const code = req.query.code;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const { access_token } = await tokenRes.json();

  // Use access token to get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const googleUser = await userRes.json();

  // Find or create local user
  let user = await User.findOne({ email: googleUser.email });
  if (!user) {
    user = await User.create({
      fullName: googleUser.name,
      email: googleUser.email,
      password: "google-oauth", // dummy, since they login via Google
    });
  }

  // Issue your existing JWT for session
  const token = createTokenForUser(user);

  // Store JWT in cookie
  res.cookie("token", token, { httpOnly: true });
  res.redirect("/"); // redirect wherever you want
});

module.exports = router;
