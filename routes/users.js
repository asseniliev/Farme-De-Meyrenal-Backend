var express = require("express");
var sendMail = require("../modules/mailerSimplified");
var router = express.Router();

const User = require("../models/user");
const Signup = require("../models/signups");
const jwt = require("jsonwebtoken");
const { Shoppingcart } = require("../models/shoppingcart");
const bcrypt = require("bcrypt");

const { deleteAllItems } = require("../routes/shoppingcarts");

//===================================================================================================
// ROUTE http://localhost:3000/users
// Fetches data from api-adresse.data.gouv.fr service based on point's latitude and longitude. 
// Used in AddressScreen.js to retrive the address when using the geolocalizer
//===================================================================================================
//Provide list of all users
router.get("/", async (req, res) => {
  // incoming data:  

  try {
    const users = await User.find();
    const result = [];
    for (const user of users) {
      result.push({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        deliveryAddress: user.deliveryAddress,
        shoppingcart: user.shoppingcart,
        isAdmin: user.isAdmin
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* GET users listing. */
router.get("/deleteAllItems", async (req, res) => {
  try {
    const result = await deleteAllItems(req.params.id);
    console.log(result);
    res.json({ result: result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/users/signup
// Accepts a request for creation of a new user:
// 1. Check if the requested user already exists or not. If not - next steps are executed
// 2. Creates a new entry in shoppingCarts collection and gets its unique id. 
//    This id will be assigned as a shopping ////cart for the newly created user
// 3. Generates a random six-digits number used to confirm user's creation
// 4. Creates a new entry in users collection, leaving the password field empty
// 5. Creates an temporary entry in signups collection containing the generated user Id, 
// the submitted password and the 6 digits code
// 6. Construct a url to be submitted by the user for verification of the identify
// 7. Submits a mail to the user containing the constructed url
//
// After receiving the email, user is supposed to click on the link to finalize the process of the creation
//===================================================================================================

router.post("/signup", async (req, res) => {
  // incoming data: 
  // req.body.email
  // req.body.password
  // req.body.firstName
  // req.body.lastName
  // req.body.phoneNumber
  // req.body.deliveryAddress {
  //   lat: Number,
  //   lon: Number,
  //   address: String,
  //   city: String,
  // }

  //1. Check if the requested user already exists
  const existingUser = await User.findOne({ email: req.body.email });



  if (existingUser === null) {
    // 2. Creates a new entry in shoppingCarts collection
    const newShoppingcart = new Shoppingcart({
      items: [],
      totalAmount: 0,
    });

    const createdShoppingcart = await newShoppingcart.save();

    // 3. Generates a random six-digits number
    const random = Math.floor(Math.random() * 1e6);

    //4. Creates a new entry in users collection
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

    // 5. Creates an temporary entry in signups collection
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

      // 6. Construct a url to be submitted by the user
      text += `http://${process.env.IP}:3000/users/afirm?email=${newUser.email}&controlCode=${random}`;

      // 7. Submits a mail to the user
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


//===================================================================================================
// ROUTE http://localhost:3000/users/afirm
// Called by the url provided in the mail sent to the user after the signup
// 1. Checks if the user mail exists. If yes - the next steps are executed
// 2. Finds the entry in signups collection corresponding to the submitted mail address and 6 digits code. 
//    If entry found - the following lines execure
// 3. Takes the password present in the signups collection and updates it in the corresponding user 
//    in users collection
// 4. Deletes the temporary entry from the signups collection
// 5. Redirect the browser to a web resource containing welcome message and image of the Meyrenal farm
//===================================================================================================

router.get("/afirm", async (req, res) => {
  // 1. Checks if the user mail exists. If yes - the next steps are executed
  const user = await User.findOne({ email: req.query.email });
  let isAfirmed = false;
  let password = "";
  if (user) {
    // 2. Finds the entry in signups collection
    const signup = await Signup.findOne({
      userId: user._id,
      controlCode: req.query.controlCode,
    });
    if (signup) {
      // 3. Takes the password present in the signups collection
      password = signup.password;
      isAfirmed = true;
    }
  }
  if (isAfirmed) {
    // 3. Update the password in the users collection
    await User.updateOne({ _id: user._id }, { password: password });
    //4. Deletes the temporary entry
    await Signup.deleteOne({ userId: user._id });

    // 5. Redirect the browser
    res.redirect(
      "https://res.cloudinary.com/dwpghnrrs/image/upload/v1678446213/Welcome_luymxv.jpg"
    );
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
    const userEmail = {
      email: req.body.email,
    };
    const accessToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET);
    res.json({ result: true, user: user, accessToken: accessToken });
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
