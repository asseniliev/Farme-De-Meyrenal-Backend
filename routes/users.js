var express = require("express");
var router = express.Router();

const User = require("../models/user");
const Signup = require("../models/signups");
const { Shoppingcart } = require("../models/shoppingcart");
const bcrypt = require("bcrypt");

const { deleteAllItems } = require("../routes/shoppingcarts");

//Provide list of all users
router.get("/", async (req, res, next) => {
  try {
    const result = await User.find();
    res.json({ result: result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* GET users listing. */
router.get("/deleteAllItems", async (req, res, next) => {
  try {
    const result = await deleteAllItems(req.params.id);
    console.log(result);
    res.json({ result: result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Create new user
router.post("/signup", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser === null) {
      const newShoppingcart = new Shoppingcart({
        items: [],
        totalAmount: 0,
      });

      const createdShoppingcart = await newShoppingcart.save();

      const random = Math.floor(Math.random() * 1e6);
      const cryptedPassword = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        password: "",
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        deliveryAddress: req.body.deliveryAddress,
        shoppingcart: createdShoppingcart._id,
        isAdmin: false,
      });

      const createdUser = await newUser.save();

      const isSignupFilled = await populateSignup(
        createdUser._id,
        cryptedPassword,
        random
      );

      if (createdUser.email === newUser.email && isSignupFilled) {
        res.json({
          result: true,
          user: createdUser,
          shoppingcart: createdShoppingcart,
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
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/afirm", async (req, res) => {
  const user = await User.findOne({ email: req.query.email });
  let isAfirmed = false;
  let password = "";

  if (user) {
    const signup = await Signup.findOne({
      userId: user._id,
      controlCode: req.query.controlCode,
    });

    if (signup) {
      password = signup.password;
      isAfirmed = true;
    }
  }

  if (isAfirmed) {
    await Signup.deleteOne({ userId: user._id });
    await User.updateOne({ _id: user._id }, { password: password });
    res.json({
      result: true,
    });
  } else {
    res.json({
      result: false,
      message: `Invalid signup confirmation request`,
    });
  }
});

//Login existing user
router.post("/signin", async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Modify existing user by id
router.put("/:id", async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Delete user (by putting its password to black)
router.delete("/:id", async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Filter users by inactive
router.get("/inactive", async (req, res) => {
  try {
    const users = await User.find({ password: "" });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Filter users by active
router.get("/active", async (req, res) => {
  try {
    const users = await User.find({ password: { $ne: "" } });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

async function populateSignup(userId, password, controlColde) {
  const newSignup = new Signup({
    userId: userId,
    password: password,
    controlCode: controlColde,
  });

  const createdSignup = await newSignup.save();

  if (createdSignup.userId === userId) {
    return true;
  } else {
    return false;
  }
}

module.exports = router;
