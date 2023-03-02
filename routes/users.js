var express = require("express");
var router = express.Router();

const User = require("../models/user");
const { Shoppingcart } = require("../models/shoppingcart");
const { deleteAllItems } = require("../routes/shoppingcarts");
const bcrypt = require("bcrypt");

/* GET users listing. */
router.get("/", function (req, res, next) {
  deleteAllItems();
  res.json({ result: true });
});

//Create new user
router.post("/signup", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser === null) {
    const newShoppingcart = new Shoppingcart({
      items: [],
      totalAmount: 0,
    });

    const createdShoppingcart = await newShoppingcart.save();

    const random = Math.floor(Math.random() * 1e6);

    const newUser = new User({
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      deliveryAddress: req.body.deliveryAddress,
      shoppingcart: createdShoppingcart._id,
      controlCode: random.toString(),
      isAdmin: false,
    });

    const createdUser = await newUser.save();

    if (createdUser.email === newUser.email) {
      res.json({
        result: true,
        user: createdUser,
        shoppingcart: createdShoppingcart,
      });
    } else {
      res.json({
        result: false,
        message: "Something went wrong. User was not created",
      });
    }
  } else {
    res.json({
      result: false,
      error: "User with this email already registered",
    });
  }
});

//Login existing user
router.post("/signin", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  let logUser = false;
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) logUser = true;
  }
  if (logUser) {
    res.json({ result: true });
  } else {
    res.json({ result: false, message: "Username or password not correct" });
  }
});

//Modify existing user by id
router.put("/:id", async (req, res) => {
  const userToUpdate = await User.updateOne(
    { _id: req.params.id },
    {
      password: bcrypt.hashSync(req.body.password, 10),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      deliveryAddress: req.body.deliveryAddress,
    }
  );

  const updatedUser = await User.findById(req.params.id);

  if (updatedUser.matchedCount > 0) {
    res.json({ result: true, user: updatedUser });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. User was not updated!",
    });
  }
});

//Delete user (by putting its password to black)
router.delete("/:id", async (req, res) => {
  await User.updateOne({ _id: req.params.id }, { password: "" });
  const deletedUser = await User.findOne({ _id: req.params.id });
  if (deletedUser.password === "") {
    res.json({ result: true });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. User was not supressed",
    });
  }
});

module.exports = router;
