const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  price: Number,
  unitScale: Number,
  priceUnit: String,
  isActive: Boolean,
});

const Product = mongoose.model("products", productSchema);

module.exports = Product;
