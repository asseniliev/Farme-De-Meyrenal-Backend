var express = require("express");
var router = express.Router();

var { Shoppingcart } = require("../models/shoppingcart");
var Product = require("../models/product");

router.put("/:id", async (req, res) => {
  const product = await Product.findById(req.body.productId);

  const newItem = {
    product: req.body.productId,
    quantity: req.body.quantity,
    itemTotal: (req.body.quantity * product.price) / product.unitScale,
  };

  const shoppingcart = await Shoppingcart.findById(req.params.id);
  const totalAmount = shoppingcart.totalAmount + newItem.itemTotal;

  shoppingcart.items.push(newItem);

  const updatedCart = await Shoppingcart.updateOne({
    items: shoppingcart.items,
    totalAmount: totalAmount,
  });

  if (updatedCart.matchedCount > 0) {
    res.json({ result: true, shippingcart: shoppingcart });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. Item was not added to the shopping cart!",
    });
  }
});

module.exports = router;
