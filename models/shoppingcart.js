const mongoose = require("mongoose");

const itemSchema = mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  quantity: Number,
  itemTotal: Number,
});

const shoppingcartSchema = mongoose.Schema({
  items: [itemSchema],
  totalAmount: Number,
});

const Shoppingcart = mongoose.model("shoppingcarts", shoppingcartSchema);

module.exports = { Shoppingcart, shoppingcartSchema };
