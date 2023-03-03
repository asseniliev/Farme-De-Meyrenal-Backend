var express = require("express");
var router = express.Router();
const { ObjectId } = require('mongodb');
const Order = require("../models/order");


//User create new order
router.post("/", async (req, res) => {
  const newOrder = new Order({
    users: req.body.id,
    date: Date.now(),
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    status: "created",
    isPaid: false,
    isCancelled: false,
  });
  const createdOrder = await newOrder.save();

  if (createdOrder.items.length === newOrder.items.length && createdOrder.totalAmount === newOrder.totalAmount) {
    res.json({
      result: true,
      message: "Order created",
    });
  } else {
    res.json({
      result: false,
      message: "Something went wrong. Order not created",
    });
  }
});

//Search order by ID
router.get("/all/:id", async (req, res) => {
  const result = await Order.findById(req.params.id)
  res.json({ result: result });
})

//Filter orders (by users, by delivery region, by status)
// Exemple por tester route: http://localhost:3000/orders/filter?city=Bron&id=1234567890
router.get("/filter", async (req, res) => {

  const id = req.query.userId;
  const city = req.query.deliveryPlace;
  const status = req.query.status;

  const result = await Order.find({
    $and: [
      id ? { _id: ObjectId(id) } : {},
      city ? { "deliveryAddress.city": city } : {},
      status ? {status} : {},
    ]
  }).populate('users');
  console.log(result)
  //res.json({ result: result });
  res.json({ result: true })
})





module.exports = router;
