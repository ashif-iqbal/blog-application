const { Router } = require("express");
const router = Router();
const Blog = require("../models/blog.js");
const Comment = require("../models/comment.js");
const path = require("path");
const multer = require("multer");
const { findById } = require("../models/user.js");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()} - ${file.originalname}`);
  },
});
const upload = multer({ storage });
router.get("/add-new", (req, res) => {
  res.render("addBlog", {
    user: req.user,
  });
});
router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImageUrl: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id.trim()).populate("createdBy");
  const comments = await Comment.find({
    blogId: req.params.id.trim(),
  }).populate("createdBy");
  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});
router.post("/comment/:id", async (req, res) => {
  const comment = await Comment.create({
    content: req.body.content,
    blogId: req.params.id.trim(),
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.id}`);
});

module.exports = router;
