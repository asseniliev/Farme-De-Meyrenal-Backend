var express = require("express");
var router = express.Router();

var Product = require("../models/product");

router.post("/", async (req, res) => {
  const existingProduct = await Product.findOne({
    title: req.body.title,
    isActive: true,
  });
  console.log(existingProduct);
  if (existingProduct) {
    res.json({
      result: false,
      message: "Product with this title already exists",
      tree: existingProduct.tree,
    });
    return;
  }

  const newProduct = new Product({
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    price: req.body.price,
    unitScale: req.body.unitScale,
    priceUnit: req.body.priceUnit,
    isActive: true,
  });

  const createdProduct = await newProduct.save();
  if (createdProduct.title === newProduct.title) {
    res.json({ result: true, product: newProduct });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. New product was not created!",
    });
  }
});

router.put("/:id", async (req, res) => {
  const productToUpdate = await Product.updateOne(
    { _id: req.params.id },
    {
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      price: req.body.price,
      isActive: req.body.isActive,
    }
  );

  if (productToUpdate.matchedCount > 0) {
    res.json({ result: true });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. Product was not updated!",
    });
  }
});

//Retrieve list of all available products for purchase
router.get("/", async (req, res) => {
  const result = await Product.find({isActive: true})
  res.json({ result: result });
})
module.exports = router;
