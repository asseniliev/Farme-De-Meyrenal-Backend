const itemSchema = mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "items" },
  quantity: Number,
  itemTotal: Number,
});

const shoppingcartSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  items: [itemSchema],
  totalAmount: Number,
});

const Shoppingcart = mongoose.model("shoppingcarts", shoppingcartSchema);

module.exports = { Shoppingcart, shoppingcartSchema };
