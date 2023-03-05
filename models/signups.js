const mongoose = require("mongoose");

const signupSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  password: String,
  controlCode: String,
});

const Signup = mongoose.model("signups", signupSchema);

module.exports = Signup;
