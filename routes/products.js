var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");

var Product = require("../models/product");
var uniqid = require("uniqid");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

router.post("/", async (req, res) => {
  const existingProduct = await Product.findOne({
    title: req.body.title,
    isActive: true,
  });

  if (existingProduct) {
    res.json({
      result: false,
      message: "Product with this title already exists",
      tree: existingProduct.tree,
    });
    return;
  }

  const tempFileName = uniqid();
  const photoPath = `./tmp/${tempFileName}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);

  if (resultMove) {
    res.json({ result: false, error: resultCopy });
    return;
  }

  const resultCloudinary = await cloudinary.uploader.upload(photoPath);
  fs.unlinkSync(photoPath);

  const newProduct = new Product({
    title: req.body.title,
    description: req.body.description,
    imageUrl: resultCloudinary.secure_url, //The url from Cloudinary
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
  const result = await Product.find({ isActive: true });
  res.json({ result: result });
});

router.post("/test", authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token === null) return res.sendStatus(401);
  //console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

module.exports = router;
