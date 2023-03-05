var express = require("express");
var router = express.Router();


var Product = require("../models/product");
var uniqid = require("uniqid");
var authenticateToken = require("../modules/authenticateToken");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

//Create a new product
router.post("/", authenticateToken, async (req, res) => {
  //incoming data:
  //header: authorization -> Bearer eyJhbGciOiJIUzI.... (jwt key)
  //req.body.title,  -> product title
  //req.files.photoFromFront -> the image of the article
  //req.body.description -> product description
  //req.body.price -> price for the unit scale (10€ per 6 eggs)
  //req.body.unitScale -> scale for the price (per 1 Kg, per 500g, etc)
  //req.body.priceUnit -> the unit of measurement (kg, piece, ...)

  try {
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

    const tempFileName = uniqid();
    const photoPath = `tmp/${tempFileName}.jpg`;
    const resultMove = await req.files.photoFromFront.mv(photoPath);

    if (resultMove) {
      res.json({ result: false, error: resultCopy });
      return;
    }

    const resultClaudinady = await cloudinary.uploader.upload(photoPath);
    fs.unlinkSync(photoPath);

    const newProduct = new Product({
      title: req.body.title,
      description: req.body.description,
      imageUrl: resultClaudinady.secure_url,
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
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Update an existing product
router.put("/:id", authenticateToken, async (req, res) => {
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
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Retrieve list of all available products for purchase
router.get("/", async (req, res) => {
  const result = await Product.find({ isActive: true })
  res.json({ result: result });
});

router.post("/test", authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
