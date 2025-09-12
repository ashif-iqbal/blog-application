const { Router } = require("express");
const User = require("../models/user.js");
const router = Router();
const Blog = require("../models/blog.js");
const Comment = require("../models/comment.js");
const { validateToken } = require("../services/authentication.js");
router.get("/", async (req, res) => {
  const allBlogs = await Blog.find({});
  return res.render("home", {
    user: req.user,
    blogs: allBlogs,
  });
});
router.get("/signin", (req, res) => {
  return res.render("signin");
});
router.get("/signup", (req, res) => {
  return res.render("signup");
});
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
  });
  return res.redirect("/signin");
});
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    res.cookie("token", token);
    return res.redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Invalid Email or Password",
    });
  }
});
router.get("/logout", (req, res) => {
  return res.clearCookie("token").redirect("/");
});
router.get("/dashboard", async (req, res) => {
  const blogs = await Blog.find({ createdBy: req.user._id });
  let count = 0;
  let commentsCount = 0;
  let commentMap = new Map();
  for (const blog of blogs) {
    count += blog.likes.length;

    const comments = await Comment.find({ blogId: blog._id });
    commentMap.set(blog, comments.length);
    commentsCount += comments.length;
  }
  return res.render("dashboard", {
    user: req.user,
    blogs,
    count,
    commentsCount,
    commentMap,
  });
});
module.exports = router;
