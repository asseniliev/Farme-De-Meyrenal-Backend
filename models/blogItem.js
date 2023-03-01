const mongoose = require("mongoose");

const blogItemSchema = mongoose.Schema({
  imageUrl: String,
  date: Date,
  text: String,
});

const BlogItem = mongoose.model("blogItems", blogItemSchema);

module.exports = BlogItem;
