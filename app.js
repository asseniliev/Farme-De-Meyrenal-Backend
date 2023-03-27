require("dotenv").config();
require("./models/connection");

var fileUpload = require("express-fileupload");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var productsRouter = require("./routes/products");
var geolocationsRouter = require("./routes/geolocations");
var { router: shoppingcartsRouter } = require("./routes/shoppingcarts.js");
var ordersRouter = require("./routes/orders");
var adminRouter = require("./routes/admin");
var testRouter = require("./routes/test");

var app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

app.use("/shoppingcarts", shoppingcartsRouter);
app.use("/orders", ordersRouter);
app.use("/locations", geolocationsRouter);
app.use("/admin", adminRouter);
app.use("/test", testRouter);

module.exports = app;
