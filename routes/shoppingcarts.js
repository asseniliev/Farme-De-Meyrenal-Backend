var express = require("express");
var router = express.Router();

var { Shoppingcart } = require("../models/shoppingcart");
var Product = require("../models/product");

router.put("/:id", async (req, res) => {
  //console.log("Product id = " + req.body.productId);
  const product = await Product.findById(req.body.productId);
  //const shoppingcart = await Shoppingcart.findById(req.params.id);

  // let totalAmount = 0;

  // const item = {
  //   product: req.body.productId,
  //   quantity: req.body.quantity,
  //   itemTotal: (req.body.quantity * product.price) / product.unitScale,
  // };

  // //Here I am using "==" and not "===" because the e.product
  // //is of type "new ObjectId("64005898238589307d3087bc") and
  // //not string. Therefore, the tripple equality will not work.
  // const productIndex = shoppingcart.items.findIndex(
  //   (e) => e.product == req.body.productId
  // );

  // if (productIndex < 0) {
  //   shoppingcart.items.push(item);
  // } else {
  //   if (req.body.quantity == 0) {
  //     //if quuantity is 0, we remove the item from the shopping cart
  //     //console.log("Remove item at index " + productIndex);
  //     shoppingcart.items.splice(productIndex, 1);
  //   } else {
  //     shoppingcart.items[productIndex].quantity = item.quantity;
  //     shoppingcart.items[productIndex].itemTotal = item.itemTotal;
  //   }
  // }

  // for (const item of shoppingcart.items) {
  //   totalAmount += item.itemTotal;
  // }

  // const cartToUpdate = await Shoppingcart.updateOne({
  //   items: shoppingcart.items,
  //   totalAmount: totalAmount,
  // });

  // const updatedShoppingcart = await Shoppingcart.findById(req.params.id);

  // if (cartToUpdate.matchedCount > 0) {
  //   res.json({ result: true, shippingcart: updatedShoppingcart });
  // } else {
  //   res.json({
  //     result: false,
  //     message: "Something went wrong. Item was not added to the shopping cart!",
  //   });
  // }

  res.json({ result: true });
});

module.exports = router;
