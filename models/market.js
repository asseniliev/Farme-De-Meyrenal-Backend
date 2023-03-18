const mongoose = require("mongoose");

const marketSchema = mongoose.Schema({
  code: String,
  name: String,
  market: {
    address: String,
    latitude: Number,
    longitude: Number,
    label: String
  },
  marketTime: String,
  homeDelivery: String,
});

const market = mongoose.model("markets", marketSchema);

module.exports = market;
