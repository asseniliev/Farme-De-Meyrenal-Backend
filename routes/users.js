var express = require("express");
var sendMail = require("../modules/mailerSimplified");
var router = express.Router();

const User = require("../models/user");
const Signup = require("../models/signups");
const jwt = require("jsonwebtoken");
const { Shoppingcart } = require("../models/shoppingcart");
const bcrypt = require("bcrypt");

const { deleteAllItems } = require("../routes/shoppingcarts");


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
        isAdmin: user.isAdmin,
      });
    }

    res.json(result);
  } catch (error) {
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
// 7. Compose and submits a mail to the user containing the constructed url
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

    // 7. Compose a mail to the user
    if (createdUser.email === newUser.email && isSignupFilled) {
      let text = "Bonjour \n\n, ";
      text +=
        'You signed up with this mail address to "Ferme-de-Meyrena" app. \n\n';
      text += "Follow the link below to finalize your signup!\n";

      // 6. Construct a url to be submitted by the user
      text += `http://${process.env.IP}/users/afirm?email=${newUser.email}&controlCode=${random}`;

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

//===================================================================================================
// ROUTE http://localhost:3000/users/signin
// Used to manage user's signin request
// 1. Check if user's mail exists and if yes - checks if the password
//    corresponds to the password in the database. If authenticated:
// 2. Generate a jwt token containing user's mail
//===================================================================================================

router.post("/signin", async (req, res) => {
  //incoming data:
  //req.body.email,
  //req.body.password,

  // 1. Check if user's mail exists
  const user = await User.findOne({ email: req.body.email });
  let logUser = false;
  if (user) {
    // 1. Checks if the password corresponds to the password in the database
    if (bcrypt.compareSync(req.body.password, user.password)) {
      logUser = true;
    }
  }
  if (logUser) {
    const userEmail = {
      email: req.body.email,
    };
    // 2. Generate a jwt token containing user's mail
    const accessToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET);
    res.json({ result: true, user: user, accessToken: accessToken });
  } else {
    res.json({ result: false, message: "Username or password not correct" });
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/users/{id}
// Modify existing user by id
//===================================================================================================

router.put("/:id", async (req, res) => {
  // incoming data:
  // req.params.id
  // req.body.firstName,
  // req.body.lastName,
  // req.body.phoneNumber,
  // req.body.deliveryAddress
  // req.body.password

  console.log(req.body);

  // //1. Get user who must be updated
  let userToUpdate = await User.findById(req.params.id);

  //2. Modify the fields according to the incoming request
  if (req.body.firstName)
    userToUpdate.firstName = req.body.firstName;

  if (req.body.lastName)
    userToUpdate.lastName = req.body.lastName;

  if (req.body.phoneNumber)
    userToUpdate.phoneNumber = req.body.phoneNumber;

  if (req.body.deliveryAddress)
    userToUpdate.deliveryAddress = req.body.deliveryAddress;

  if (req.body.password)
    userToUpdate.password = bcrypt.hashSync(req.body.password, 10);

  //3. Make the update in the database
  try {

    const updatedUser = await User.updateOne(
      { _id: req.params.id },
      userToUpdate
    );

    if (updatedUser.matchedCount > 0) {
      res.json({ result: true, user: userToUpdate });
    } else {
      res.json({
        result: false,
        message: "Something went wrong. User was not updated!",
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }

  //res.json({ result: true });
});

//===================================================================================================
// ROUTE http://localhost:3000/users/{id}
// Delete existing user by id (by setting its password to "")
//===================================================================================================
router.delete("/:id", async (req, res) => {
  // incoming data:
  // req.params.id
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
    res.status(500).send("Internal Server Error");
  }
});

//Filter users by inactive
router.get("/inactive", async (req, res) => {
  try {
    const users = await User.find({ password: "" });
    res.json(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//Filter users by active
router.get("/active", async (req, res) => {
  try {
    const users = await User.find({ password: { $ne: "" } });
    res.json(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/users/contact - NOT USED. STAYS HERE FOR REFERENCE BUT WILL BE LATER REMOVED
// Sends a message to Flavian when user works with "Contact Flavian" functionality
// 1. Check what option for contact user has selected
// 2. Compose the message to Flavian
// 3. Submit the message
//===================================================================================================
router.post("/contact", async (req, res) => {
  //incoming data:
  //req.body.userId,  -> this is the User._id value
  //req.body.method,  -> possible values are "phone" and "message";
  //req.body.message, -> the message from the client

  const user = await User.findById(req.body.userId);
  const mailTitle = "Client contacted you";
  let mailText = "Bonjour, \n\n";

  // 1. Check what option for contact user has selected
  switch (req.body.method) {
    // 2. Compose the message to Flavian
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

  // 3. Submit the message
  // !!! ATTENTION !!!
  // Here on the place of the 'user.email' we must set the real mail of Flavian.
  // We leave 'user.email' as we are testing with our own mails
  sendMail(user.email, mailTitle, mailText);
  res.json({ result: true }); // This function must be further elaborated to process eventual errors occurring during mails submission
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
