import addressSchema from "./address";
const mongoose = require("mongoose");

const marketAddressSchema = mongoose.Schema({
  address: addressSchema,
  description: String,
});

const marketAddress = mongoose.model("marketAddresses", marketAddressSchema);

module.exports = marketAddress;
