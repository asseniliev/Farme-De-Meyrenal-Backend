const itemSchema = mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  price: Number,
  priceUnit: String,
});

const Item = mongoose.model("items", itemSchema);

module.exports = Item;
