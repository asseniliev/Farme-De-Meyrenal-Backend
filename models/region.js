const mongoose = require("mongoose");

const regionSchema = mongoose.Schema({
  code: String,
  name: String,
  market: {
    address: String,
    latitude: Number,
    longitude: Number,
    label: String,
    marketHours: String,
  },
  homeDeliveryHours: String,
});

const region = mongoose.model("regions", regionSchema);

module.exports = region;
