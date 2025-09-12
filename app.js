const express = require("express");
require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;
const router = require("./routes/user.js");
const blogRouter = require("./routes/blog.js");
const googleRouter = require("./routes/google.js");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication.js");
const url = process.env.MONGODB_URL;
mongoose.connect(url).then(() => {
  console.log("MongoDb Connected");
});

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));
app.use("/", router);
app.use("/blog", blogRouter);
app.use("/auth/google", googleRouter);
app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
