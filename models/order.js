const { shoppingcartSchema } = require("./shoppingcart");
const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderNumber: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  city: String,
  date: Date,
  items: [],
  totalAmount: Number,
  status: String, // created / confirmed / delivred /
  isPaid: Boolean,
  isCancelled: Boolean,
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
