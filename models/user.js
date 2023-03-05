const addressSchema = require("./address");
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  phoneNumber: String,
  deliveryAddress: addressSchema,
  shoppingcart: { type: mongoose.Schema.Types.ObjectId, ref: "shoppingcarts" },
  isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
