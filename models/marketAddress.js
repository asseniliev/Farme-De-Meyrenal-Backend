import addressSchema from "./address";

const marketAddressSchema = mongoose.Schema({
  address: addressSchema,
  description: String,
});

const marketAddress = mongoose.model("marketAddresses", marketAddressSchema);

module.exports = marketAddress;
