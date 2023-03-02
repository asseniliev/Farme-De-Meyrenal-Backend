require("dotenv").config();
require("./models/connection");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var productsRouter = require("./routes/products");
<<<<<<< HEAD
var { router: shoppingcartRouter } = require("./routes/shoppingcarts.js");
=======
var shoppingcartsRouter = require("./routes/shoppingcarts.js");
var orderRouter = require("./routes/orders");
>>>>>>> 275f9e862f3b699f3acdb5d08e8a3c584fae24fb

var app = express();
const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);
<<<<<<< HEAD
app.use("/shoppingcarts", shoppingcartRouter);
=======
app.use("/shoppingcarts", shoppingcartsRouter);
app.use("/orders", orderRouter);
>>>>>>> 275f9e862f3b699f3acdb5d08e8a3c584fae24fb

module.exports = app;
