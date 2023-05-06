var express = require("express");
var router = express.Router();

var Product = require("../models/product");
var uniqid = require("uniqid");
var authenticateToken = require("../modules/authenticateToken");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

//===================================================================================================
// ROUTE http://localhost:3000/products
// Create a new product
// 1. Checks if  jwt token is valid and if user is active. If yes - following steps take place
// 2. Check if there is an existing active product with the same name. If not - following step are completed
// 3. Store temp file with the image in the backend folders
// 4. Upload the image file in Claudinary repository
// 5. Construct data of the product to be created
// 6. Create new document in the products collection
//===================================================================================================
router.post("/", authenticateToken, async (req, res) => {
  //router.post("/", async (req, res) => {
  // incoming data:
  // header: authorization -> Bearer eyJhbGciOiJIUzI.... (jwt key)
  // req.body.title,  -> product title
  // req.files.photoFromFront -> the image of the article
  // req.body.description -> product description
  // req.body.price -> price for the unit scale (10€ per 6 eggs)
  // req.body.unitScale -> scale for the price (per 1 Kg, per 500g, etc)
  // req.body.priceUnit -> the unit of measurement (kg, piece, ...)

  try {
    // 2. Check if there is an existing active product
    const existingProduct = await Product.findOne({
      title: req.body.title,
      isActive: true,
    });

    if (existingProduct) {
      res.json({
        result: false,
        message: "Product with this title already exists",
      });
      return;
    }

    // 3. Store temp file with the image
    const tempFileName = uniqid();
    const photoPath = `tmp/${tempFileName}.jpg`;
    const resultMove = await req.files.photoFromFront.mv(photoPath);

    if (resultMove) {
      res.json({ result: false, error: resultCopy });
      return;
    }

    // 4. Upload the image in Claudinary
    const resultClaudinady = await cloudinary.uploader.upload(photoPath);
    fs.unlinkSync(photoPath);

    // 5. Construct data of the product
    const newProduct = new Product({
      title: req.body.title,
      description: req.body.description,
      imageUrl: resultClaudinady.secure_url,
      price: req.body.price,
      unitScale: req.body.unitScale,
      priceUnit: req.body.priceUnit,
      isActive: true,
    });

    // 6. Create new document in the collection
    const createdProduct = await newProduct.save();
    if (createdProduct.title === newProduct.title) {
      res.json({ result: true, product: newProduct });
    } else {
      res.json({
        result: false,
        message: "Something went wrong. New product was not created!",
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/products/{id}
// Update an existing product
// 1. Checks if  jwt token is valid and if user is active. If yes - following steps take place
// 2. Updates the product using the provided data
//===================================================================================================

router.put("/:id", async (req, res) => {
  //router.put("/:id", authenticateToken, async (req, res) => {
  // Incoming data:
  // req.params.id  - product id
  // req.body.description
  // req.body.imageUrl
  // req.body.price
  // req.body.isActive  - used to activate/deactivate the product
  try {
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
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/products
// Retrieve list of all available products for purchase
//===================================================================================================
router.get("/", async (req, res) => {
  const result = await Product.find({ isActive: true });
  res.json({ result: result });
});

module.exports = router;

//===================================================================================================
// ROUTE http://localhost:3000/products/all
// Retrieve list of all products in the database (both active and inactive)
//===================================================================================================
router.get("/all", async (req, res) => {
  const result = await Product.find();
  res.json({ result: result });
});

module.exports = router;
