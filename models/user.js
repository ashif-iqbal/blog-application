const { Schema, model } = require("mongoose");
const { randomBytes, createHmac } = require("crypto");
const { createTokenForUser } = require("../services/authentication.js");
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageUrl: {
      type: String,
      default: "/images/default.png",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  // used normal function instead of a arrow function because of the different behavior or this keyword with arrow functions because arrow functions do not have their own "this".
  const user = this;
  if (!user.isModified("password")) return next();
  const salt = randomBytes(16).toString();
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");
  this.salt = salt;
  this.password = hashedPassword;
  next();
}); // middleware that runs before saving a entry in the database

// virtual function
userSchema.static(
  "matchPasswordAndGenerateToken",
  async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error("User not found!");
    const salt = user.salt;
    const hashedPassword = user.password;
    const userProvidedHash = createHmac("sha256", salt)
      .update(password)
      .digest("hex");
    if (userProvidedHash !== hashedPassword) throw new Error("wrong password");
    const token = createTokenForUser(user);
    return token;
  }
);
const User = model("users", userSchema);
module.exports = User;
