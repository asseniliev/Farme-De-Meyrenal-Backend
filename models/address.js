const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  lat: Number,
  lon: Number,
  address: String,
});

module.exports = addressSchema;
