var express = require("express");
var router = express.Router();

const Order = require("../models/order");

router.post("/", async (req, res) => {
  const newOrder = new Order({
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

module.exports = router;
