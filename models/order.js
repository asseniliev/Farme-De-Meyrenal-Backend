import shoppingcartSchema from "./shoppingcart";
const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  date: Date,
  content: shoppingcartSchema,
  status: String,
  isCancelled: Boolean,
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
