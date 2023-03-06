var express = require("express");
var sendMail = require("../modules/mailer");
var router = express.Router();

const User = require("../models/user");
const Signup = require("../models/signups");
const jwt = require("jsonwebtoken");
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
  const existingUser = await User.findOne({ email: req.body.email });
  console.log(req.body);
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
      let text = "Bonjour \n\n, ";
      text +=
        'You signed up with this mail address to "Ferme-de-Meyrena" app. \n\n';
      text += "Follow the link below to finalize your signup!\n";
      text += `http://localhost:3000/users/afirm?email=${newUser.email}&controlCode=${random}`;

      await sendMail(
        newUser.email,
        "Confirm signup in Ferme-de-Meyrenal app",
        text
      );
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

router.get("/afirm", async (req, res) => {
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
    // res.json({
    //   result: true,
    // });
    res.redirect("https://www.youtube.com/");
  } else {
    res.json({
      result: false,
      message: `Invalid signup confirmation request`,
    });
  }
});

//Login existing user
router.post("/signin", async (req, res) => {
  //incoming data:
  //req.body.email,
  //req.body.password,
  const user = await User.findOne({ email: req.body.email });
  let logUser = false;
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      logUser = true;
    }
  }
  if (logUser) {
    const user = {
      email: req.body.email,
    };

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.json({ result: true, accessToken: accessToken });
  } else {
    res.json({ result: false, message: "Username or password not correct" });
  }
});

//Modify existing user by id/
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

router.post("/contact", async (req, res) => {
  //incoming data:
  //req.body.userId,  -> this is the User._id value
  //req.body.method,  -> possible values are "phone" and "message";
  //req.body.message, -> the message from the client

  const user = await User.findById(req.body.userId);
  const mailTitle = "Client contacted you";
  let mailText = "Bonjour, \n\n";

  switch (req.body.method) {
    case "phone":
      mailText += `Client ${user.firstName} ${user.lastName} would like to speak with you.\n`;
      mailText += `Please call at phone number ${user.phoneNumber}\n\n`;
      mailText += `Automatically generated message`;
      break;
    case "message":
      mailText += `Client ${user.firstName} ${user.lastName} sent you the following message.\n`;
      mailText +=
        "*********************************************************************************\n\n";
      mailText += req.body.message;
      mailText +=
        "\n\n*********************************************************************************\n";
      mailText += `Automatically generated message`;
      break;
  }

  sendMail(user.email, mailTitle, mailText);
  res.json({ result: true, method: "By phone" });
});

// router.post("/test", (req, res) => {
//   const user = {
//     email: "ali.baba@gmail.com",
//     password: "12345678",
//     myField: "Best field in the world",
//   };

//   const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
//   res.json({ result: true, accessToken: accessToken });
// });

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
