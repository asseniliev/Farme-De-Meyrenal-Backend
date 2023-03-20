const mongoose = require("mongoose");


const itemSchema = mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  title: String,
  quantity: Number,
  price: Number,
  priceUnit: String,
});

const orderSchema = mongoose.Schema({
  orderNumber: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  city: String,
  date: Date,
  items: [itemSchema],
  totalAmount: Number,
  status: String, // created / confirmed / delivred /
  isPaid: Boolean,
  isCancelled: Boolean,
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
