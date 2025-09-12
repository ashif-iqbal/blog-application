const { Router } = require("express");
const User = require("../models/user.js");
const router = Router();
const { createTokenForUser } = require("../services/authentication.js");

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

router.get("/callback", async (req, res) => {
  const code = req.query.code;

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

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const googleUser = await userRes.json();

  let user = await User.findOne({ email: googleUser.email });
  if (!user) {
    user = await User.create({
      fullName: googleUser.name,
      email: googleUser.email,
      password: "google-oauth",
    });
  }

  const token = createTokenForUser(user);

  res.cookie("token", token, { httpOnly: true });
  res.redirect("/");
});

module.exports = router;
