const {shoppingcartSchema} = require ("./shoppingcart");
const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  users: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  date: Date,
  items: [],
  totalAmount: Number,
  status: String, // created / confirmed / delivred / 
  isPaid: Boolean,
  isCancelled: Boolean,
});

const Order = mongoose.model("orders", orderSchema);

module.exports = Order;
