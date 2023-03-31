var express = require("express");
var router = express.Router();

var { Shoppingcart } = require("../models/shoppingcart");
var Product = require("../models/product");

//===================================================================================================
// ROUTE http://localhost:3000/shoppingcarts/{id}
// Updates the shopping cart: adds a new item (if item not yet present in the cart)
// or updates its quantity (if product is already present)
// 1. Find the shopping cart and the product whose id's are submitted in the request
// 2. Construct item object to be used to update the shopping cart
// 3. Check if the product id is already present in the shopping cart. If not - push the item. If yes - update its quantity
// 4. Calculate new shopping cart's total value
//===================================================================================================
router.put("/:id", async (req, res) => {
  // incoming data:
  // req.params.id   (shopping cart id)
  // req.body.productId
  // req.body.quantity

  try {
    // 1. Find the shopping cart and the product
    const product = await Product.findById(req.body.productId);
    const shoppingcart = await Shoppingcart.findById(req.params.id);

    let totalAmount = 0;

    // 2. Construct item object to be used to update the shopping cart
    const item = {
      product: req.body.productId,
      quantity: req.body.quantity,
      itemTotal: (req.body.quantity * product.price) / product.unitScale,
    };

    // 3. Check if the product id is already present
    // If not - push the item. If yes - update its quantity

    // Here I am using "==" and not "===" because the e.product
    // is of type "new ObjectId("64005898238589307d3087bc") and
    // not string. Therefore, the tripple equality will not work.
    const productIndex = shoppingcart.items.findIndex(
      (e) => e.product == req.body.productId
    );

    if (productIndex < 0) {
      shoppingcart.items.push(item);
    } else {
      if (req.body.quantity == 0) {
        //if quuantity is 0, we remove the item from the shopping cart
        shoppingcart.items.splice(productIndex, 1);
      } else {
        shoppingcart.items[productIndex].quantity = item.quantity;
        shoppingcart.items[productIndex].itemTotal = item.itemTotal;
      }
    }

    // 4. Calculate new shopping cart's total value
    for (const item of shoppingcart.items) {
      totalAmount += item.itemTotal;
    }

    // Actual update of the database
    const cartToUpdate = await Shoppingcart.updateOne(
      { _id: req.params.id },
      {
        items: shoppingcart.items,
        totalAmount: totalAmount,
      }
    );

    const updatedShoppingcart = await Shoppingcart.findById(req.params.id);

    if (cartToUpdate.matchedCount > 0) {
      res.json({ result: true, shippingcart: updatedShoppingcart });
    } else {
      res.json({
        result: false,
        message:
          "Something went wrong. Item was not added to the shopping cart!",
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

async function deleteAllItems(cartId) {
  const cartToUpdate = await Shoppingcart.updateOne(
    { _id: cartId },
    {
      items: [],
      totalAmount: 0,
    }
  );

  if (cartToUpdate.matchedCount > 0) {
    return { result: true };
  } else {
    return {
      result: false,
      message: "Something went wrong. Shopping cart was not nulled",
    };
  }
}

module.exports = { router, deleteAllItems };
